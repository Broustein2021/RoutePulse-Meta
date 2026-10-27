import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRoutePulseStore } from "@/store/useRoutePulseStore";
import { INCIDENT_TYPES } from "@/lib/mockData";
import { AlertTriangle, Siren, CarFront, Waves, ShieldAlert, HardHat, Newspaper, MapPin } from "lucide-react";

const iconMap = { AlertTriangle, Siren, CarFront, Waves, ShieldAlert, HardHat };

export function SearchDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const posts = useRoutePulseStore((s) => s.posts);
  const incidents = useRoutePulseStore((s) => s.incidents);

  const handleSelect = useCallback(
    (type, id) => {
      onOpenChange(false);
      if (type === "post") navigate(`/app/feed/${id}`);
      else navigate("/app/carte", { state: { highlight: id } });
    },
    [navigate, onOpenChange],
  );

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une alerte, un lieu..." />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Posts">
          {posts.slice(0, 10).map((p) => {
            const meta = INCIDENT_TYPES[p.type];
            return (
              <CommandItem key={`post-${p.id}`} value={`post-${p.location}-${p.text}-${p.id}`} onSelect={() => handleSelect("post", p.id)}>
                <Newspaper className="w-4 h-4 text-primary" />
                <span className="truncate flex-1">{p.text.slice(0, 60)}</span>
                <span className="text-xs text-muted-foreground ml-2">{p.location}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading="Incidents">
          {incidents.slice(0, 10).map((i) => {
            const meta = INCIDENT_TYPES[i.type];
            const Icon = iconMap[meta?.icon] || AlertTriangle;
            return (
              <CommandItem key={`inc-${i.id}`} value={`inc-${i.road}-${i.id}`} onSelect={() => handleSelect("incident", i.id)}>
                <Icon className="w-4 h-4" />
                <span className="truncate flex-1">{meta?.label} · {i.road}</span>
                <span className="text-xs text-muted-foreground">{i.time}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
