import React, { useState, useEffect } from "react";
import { AlertPost } from "@/components/routepulse/AlertPost";
import { FeedSkeleton } from "@/components/routepulse/Skeletons";
import { EmptyState } from "@/components/routepulse/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoutePulseStore, selectPosts } from "@/store/useRoutePulseStore";
import { Flame, Clock, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NEARBY_KEYWORD = "cocody";

export default function Feed() {
  const [tab, setTab] = useState("hot");
  const [loading, setLoading] = useState(true);
  const posts = useRoutePulseStore(selectPosts);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const visiblePosts = (() => {
    if (tab === "hot") {
      return [...posts].sort((a, b) => b.likes - a.likes);
    }
    if (tab === "recent") {
      return [...posts].reverse();
    }
    if (tab === "near") {
      return posts.filter((p) =>
        p.location.toLowerCase().includes(NEARBY_KEYWORD),
      );
    }
    return posts;
  })();

  return (
    <div className="px-4 pt-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Le fil</h1>
        <p className="text-sm text-muted-foreground">Ce que la ville partage en ce moment</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList className="grid grid-cols-3 w-full bg-muted rounded-xl h-10">
          <TabsTrigger value="hot" className="data-[state=active]:bg-card rounded-lg text-xs gap-1.5">
            <Flame className="w-3.5 h-3.5" /> Tendances
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-card rounded-lg text-xs gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Récents
          </TabsTrigger>
          <TabsTrigger value="near" className="data-[state=active]:bg-card rounded-lg text-xs gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Autour
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-3">
        {loading ? (
          <FeedSkeleton />
        ) : visiblePosts.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Aucune alerte ici"
            description={
              tab === "near"
                ? "Aucun signalement près de ta zone pour l'instant."
                : "Le fil est vide pour cet onglet."
            }
            action={
              tab !== "near" ? (
                <Button onClick={() => navigate("/app/signaler")} size="sm" className="rounded-xl">
                  Signaler un incident
                </Button>
              ) : null
            }
          />
        ) : (
          visiblePosts.map((p) => <AlertPost key={p.id} post={p} />)
        )}
      </div>
    </div>
  );
}
