import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getInitialIncidents,
  getInitialPosts,
  CURRENT_USER,
  DEFAULT_REPORT_LOCATION,
  INCIDENT_TYPES,
} from "@/lib/mockData";

const STORAGE_KEY = "routepulse-storage";

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Place new pins near the mock user location with slight randomness. */
const randomMapCoords = () => ({
  x: Math.round(180 + Math.random() * 420),
  y: Math.round(120 + Math.random() * 320),
});

const buildDefaultPostText = (type, note) => {
  const label = INCIDENT_TYPES[type]?.label ?? "Incident";
  if (note?.trim()) return note.trim();
  return `Signalement ${label.toLowerCase()} signalé par la communauté.`;
};

export const useRoutePulseStore = create(
  persist(
    (set, get) => ({
      incidents: getInitialIncidents(),
      posts: getInitialPosts(),
      likedPostIds: {},
      confirmedIncidentIds: {},
      confirmedPostIds: {},

      submitReport: ({ type, severity, note, postToFeed = true, location, road }) => {
        const alertId = createId();
        const incidentId = `i-${alertId}`;
        const { x, y } = randomMapCoords();
        const resolvedLocation = location ?? DEFAULT_REPORT_LOCATION.location;
        const resolvedRoad = road ?? DEFAULT_REPORT_LOCATION.road;

        const incident = {
          id: incidentId,
          type,
          x,
          y,
          road: resolvedRoad,
          severity,
          confirmed: 1,
          time: "à l'instant",
          postId: postToFeed ? `p-${alertId}` : null,
        };

        const post = postToFeed
          ? {
              id: `p-${alertId}`,
              incidentId,
              author: { ...CURRENT_USER },
              time: "à l'instant",
              location: resolvedLocation,
              type,
              severity,
              text: buildDefaultPostText(type, note),
              image: null,
              likes: 0,
              comments: 0,
              shares: 0,
              confirmed: 1,
            }
          : null;

        set((state) => ({
          incidents: [incident, ...state.incidents],
          posts: post ? [post, ...state.posts] : state.posts,
          confirmedIncidentIds: {
            ...state.confirmedIncidentIds,
            [incidentId]: true,
          },
          ...(post
            ? {
                confirmedPostIds: {
                  ...state.confirmedPostIds,
                  [post.id]: true,
                },
              }
            : {}),
        }));

        return { incident, post };
      },

      confirmIncident: (incidentId) => {
        const state = get();
        if (state.confirmedIncidentIds[incidentId]) {
          return false;
        }

        const linkedPost = state.posts.find((p) => p.incidentId === incidentId);

        set({
          confirmedIncidentIds: {
            ...state.confirmedIncidentIds,
            [incidentId]: true,
          },
          incidents: state.incidents.map((incident) =>
            incident.id === incidentId
              ? { ...incident, confirmed: incident.confirmed + 1 }
              : incident,
          ),
          ...(linkedPost
            ? {
                confirmedPostIds: {
                  ...state.confirmedPostIds,
                  [linkedPost.id]: true,
                },
                posts: state.posts.map((post) =>
                  post.id === linkedPost.id
                    ? { ...post, confirmed: post.confirmed + 1 }
                    : post,
                ),
              }
            : {}),
        });

        return true;
      },

      confirmPost: (postId) => {
        const state = get();
        if (state.confirmedPostIds[postId]) {
          return false;
        }

        const post = state.posts.find((p) => p.id === postId);
        if (!post) return false;

        const linkedIncidentId = post.incidentId;

        set({
          confirmedPostIds: {
            ...state.confirmedPostIds,
            [postId]: true,
          },
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, confirmed: p.confirmed + 1 } : p,
          ),
          ...(linkedIncidentId
            ? {
                confirmedIncidentIds: {
                  ...state.confirmedIncidentIds,
                  [linkedIncidentId]: true,
                },
                incidents: state.incidents.map((incident) =>
                  incident.id === linkedIncidentId
                    ? { ...incident, confirmed: incident.confirmed + 1 }
                    : incident,
                ),
              }
            : {}),
        });

        return true;
      },

      toggleLike: (postId) => {
        const state = get();
        const alreadyLiked = !!state.likedPostIds[postId];

        set({
          likedPostIds: {
            ...state.likedPostIds,
            [postId]: !alreadyLiked,
          },
          posts: state.posts.map((post) =>
            post.id === postId
              ? { ...post, likes: post.likes + (alreadyLiked ? -1 : 1) }
              : post,
          ),
        });
      },

      resetStore: () =>
        set({
          incidents: getInitialIncidents(),
          posts: getInitialPosts(),
          likedPostIds: {},
          confirmedIncidentIds: {},
          confirmedPostIds: {},
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        incidents: state.incidents,
        posts: state.posts,
        likedPostIds: state.likedPostIds,
        confirmedIncidentIds: state.confirmedIncidentIds,
        confirmedPostIds: state.confirmedPostIds,
      }),
    },
  ),
);

/** Selectors for fine-grained subscriptions. */
export const selectIncidents = (state) => state.incidents;
export const selectPosts = (state) => state.posts;
export const selectPostById = (id) => (state) =>
  state.posts.find((post) => post.id === id);
export const selectIncidentById = (id) => (state) =>
  state.incidents.find((incident) => incident.id === id);
export const selectIsPostLiked = (postId) => (state) =>
  !!state.likedPostIds[postId];
export const selectIsPostConfirmed = (postId) => (state) =>
  !!state.confirmedPostIds[postId];
export const selectIsIncidentConfirmed = (incidentId) => (state) =>
  !!state.confirmedIncidentIds[incidentId];
