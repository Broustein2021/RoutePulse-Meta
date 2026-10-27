import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Flag, ShieldCheck, MapPin, MoreHorizontal, Bookmark, Navigation } from "lucide-react";
import { INCIDENT_TYPES, TRAFFIC_LEVELS } from "@/lib/mockData";
import {
  useRoutePulseStore,
  selectIsPostLiked,
  selectIsPostConfirmed,
} from "@/store/useRoutePulseStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const AlertPost = ({ post, compact = false }) => {
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const toggleLike = useRoutePulseStore((s) => s.toggleLike);
  const confirmPost = useRoutePulseStore((s) => s.confirmPost);
  const liked = useRoutePulseStore(selectIsPostLiked(post.id));
  const confirmed = useRoutePulseStore(selectIsPostConfirmed(post.id));

  const meta = INCIDENT_TYPES[post.type];
  const severity = TRAFFIC_LEVELS[post.severity];

  const handleLike = () => {
    toggleLike(post.id);
  };

  const handleShare = () => {
    toast.success("Lien copié dans le presse-papier", { description: "Partage avec ta communauté 🙌" });
  };

  const handleReport = () => {
    toast("Signalement envoyé", { description: "Un modérateur va vérifier ce contenu." });
  };

  const handleConfirm = () => {
    const ok = confirmPost(post.id);
    if (ok) {
      toast.success("Alerte confirmée ✅", { description: "Merci, tu aides à fiabiliser l'info." });
    } else {
      toast.info("Tu as déjà confirmé cette alerte");
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-elevated transition-shadow duration-300"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar className="h-11 w-11 ring-2 ring-primary/10">
          <AvatarFallback className="bg-gradient-hero text-primary-foreground font-semibold text-sm">
            {post.author.avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-foreground truncate">{post.author.name}</span>
            {post.author.verified && (
              <ShieldCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            )}
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium border-primary/20 text-primary bg-primary/5">
              {post.author.badge}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span
              className="truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate('/app/carte', { state: { highlight: post.incidentId } })}
            >
              {post.location}
            </span>
            <span>·</span>
            <span>{post.time}</span>
          </div>
        </div>
      </div>

      {/* Type banner */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `hsl(var(--traffic-${post.severity}) / 0.12)`, color: `hsl(var(--traffic-${post.severity}))` }}
        >
          <span className="text-sm leading-none">{meta.emoji}</span>
          <span>{meta.label}</span>
          <span className="opacity-70">· {severity.label}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
            <ShieldCheck className="w-3 h-3" />
            {post.confirmed} confirm.
          </span>
        </div>
      </div>

      {/* Text */}
      <p className="px-4 text-[15px] leading-relaxed text-foreground">{post.text}</p>

      {/* Image */}
      {post.image && !compact && (
        <div className="mt-3 mx-4 rounded-xl overflow-hidden border border-border">
          <img src={post.image} alt="Alerte" className="w-full h-56 object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-auto p-2 pt-3 border-t border-border/60 mx-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/feed/${post.id}`)} className="flex-1 gap-1.5 rounded-xl text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{post.comments}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleConfirm}
          disabled={confirmed}
          className={`flex-1 gap-1.5 rounded-xl ${confirmed ? "text-accent opacity-70" : "text-accent hover:text-accent hover:bg-accent/10"}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-medium">
            {confirmed ? "Confirmé" : "Confirmer"}
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl min-w-[160px]">
            <DropdownMenuItem onClick={handleLike} className="gap-2">
              <Heart className={`w-4 h-4 ${liked ? "fill-primary text-primary" : ""}`} />
              <span>{liked ? "Retirer le like" : "J'aime"}</span>
              <span className="ml-auto text-xs text-muted-foreground">{post.likes}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              <span>Partager</span>
              <span className="ml-auto text-xs text-muted-foreground">{post.shares}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSaved(!saved)} className="gap-2">
              <Bookmark className={`w-4 h-4 ${saved ? "fill-primary text-primary" : ""}`} />
              <span>{saved ? "Sauvegardé" : "Sauvegarder"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/carte', { state: { highlight: post.incidentId } })} className="gap-2">
              <Navigation className="w-4 h-4" />
              <span>Voir sur la carte</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReport} className="gap-2 text-destructive">
              <Flag className="w-4 h-4" />
              <span>Signaler</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.article>
  );
};

export default AlertPost;
