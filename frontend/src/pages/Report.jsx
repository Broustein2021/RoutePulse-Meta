import React, { useState, useRef } from "react";
import { INCIDENT_TYPES, TRAFFIC_LEVELS, DEFAULT_REPORT_LOCATION } from "@/lib/mockData";
import { useRoutePulseStore } from "@/store/useRoutePulseStore";
import {
  AlertTriangle, Siren, CarFront, Waves, ShieldAlert, HardHat,
  Camera, MapPin, Zap, Sparkles, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const iconMap = { AlertTriangle, Siren, CarFront, Waves, ShieldAlert, HardHat };

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

export default function Report() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [severity, setSeverity] = useState("dense");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [postToFeed, setPostToFeed] = useState(true);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const submitReport = useRoutePulseStore((s) => s.submitReport);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(await readFileAsDataURL(file));
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    submitReport({ type, severity, note, postToFeed });
    setSent(true);
    setSubmitting(false);
    toast.success("Alerte envoyée ⚡", { description: "Merci, la communauté est alertée !" });
    setTimeout(() => navigate("/app/feed"), 2000);
  };

  const meta = type ? INCIDENT_TYPES[type] : null;
  const totalSteps = 4;

  return (
    <div className="px-4 pt-4 pb-20">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold">Signaler un incident</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" /> Cocody, Riviera 3 · GPS actif
          </p>
        </div>
      </div>

      {!sent && (
        <div className="mt-4 flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i < step ? "bg-primary flex-1" : "bg-muted flex-1 opacity-60"}`} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-16 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center">
              <Check className="w-10 h-10 text-accent" strokeWidth={3} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">Alerte envoyée !</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Ta contribution est visible sur la carte et dans le fil. +15 pts 🔥
            </p>
            <div className="mt-6 flex gap-2">
              <Button onClick={() => navigate("/app/feed")} variant="outline" className="rounded-xl">Voir le fil</Button>
              <Button onClick={() => navigate("/app/carte")} className="rounded-xl bg-foreground text-background">Voir la carte</Button>
            </div>
          </motion.div>
        ) : step === 1 ? (
          <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <p className="mt-6 text-sm font-medium text-foreground">1. Que se passe-t-il ?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.entries(INCIDENT_TYPES).map(([key, m]) => {
                const Icon = iconMap[m.icon] || AlertTriangle;
                const active = type === key;
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                      active ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-foreground/30"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.label}</p>
                      <p className="text-[11px] text-muted-foreground">{m.emoji}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button disabled={!type} onClick={() => setStep(2)} className="mt-6 w-full h-12 rounded-xl bg-foreground text-background disabled:opacity-40">
              Continuer
            </Button>
          </motion.div>
        ) : step === 2 ? (
          <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <p className="mt-6 text-sm font-medium">2. Quel est le niveau ?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.entries(TRAFFIC_LEVELS).map(([key, val]) => {
                const active = severity === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSeverity(key)}
                    className={`p-4 rounded-2xl border text-left transition-all ${active ? "border-foreground" : "border-border"}`}
                    style={active ? { borderColor: `hsl(var(--traffic-${key}))`, background: `hsl(var(--traffic-${key}) / 0.06)` } : {}}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: val.hex }} />
                      <span className="font-semibold text-sm">{val.label}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {key === "fluid" && "Léger, ça passe"}
                      {key === "dense" && "Ralentissements"}
                      {key === "blocked" && "Ça n'avance plus"}
                      {key === "danger" && "Risque important"}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">Retour</Button>
              <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl bg-foreground text-background">Continuer</Button>
            </div>
          </motion.div>
        ) : step === 3 ? (
          <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <p className="mt-6 text-sm font-medium">3. Ajoute des détails (optionnel)</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Décris la situation en quelques mots..."
              className="mt-2 min-h-[110px] rounded-2xl border-border bg-card resize-none"
            />

            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            {photoPreview ? (
              <div className="mt-3 relative rounded-2xl overflow-hidden border border-border">
                <img src={photoPreview} alt="Aperçu" className="w-full h-40 object-cover" />
                <button
                  onClick={removePhoto}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-3 w-full p-4 rounded-2xl border border-dashed border-border bg-card flex items-center gap-3 text-left hover:border-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ajouter une photo</p>
                  <p className="text-[11px] text-muted-foreground">Aide la commu à confirmer plus vite</p>
                </div>
              </button>
            )}

            <div className="mt-4 flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div>
                <p className="font-semibold text-sm flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /> Publier dans le fil</p>
                <p className="text-[11px] text-muted-foreground">Ta commu pourra réagir et confirmer</p>
              </div>
              <Switch checked={postToFeed} onCheckedChange={setPostToFeed} />
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl">Retour</Button>
              <Button onClick={() => setStep(4)} className="flex-1 h-12 rounded-xl bg-foreground text-background">Vérifier</Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="s4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <p className="mt-6 text-sm font-medium">4. Vérifie avant d'envoyer</p>
            <div className="mt-3 rounded-2xl bg-card border border-border p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `hsl(var(--traffic-${severity}) / 0.15)`, color: `hsl(var(--traffic-${severity}))` }}
                >
                  {meta && React.createElement(iconMap[meta.icon] || AlertTriangle, { className: "w-5 h-5" })}
                </div>
                <div>
                  <p className="font-semibold text-sm">{meta?.label} · {TRAFFIC_LEVELS[severity]?.label}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {DEFAULT_REPORT_LOCATION.location}
                  </p>
                </div>
              </div>

              {note && (
                <div className="p-3 rounded-xl bg-muted/60">
                  <p className="text-xs text-muted-foreground mb-0.5">Note :</p>
                  <p className="text-sm">{note}</p>
                </div>
              )}

              {photoPreview && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <img src={photoPreview} alt="Photo" className="w-full h-32 object-cover" />
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Publication dans le fil</span>
                <span className="font-semibold">{postToFeed ? "Oui" : "Non"}</span>
              </div>
            </div>

            <Button
              onClick={submit}
              disabled={submitting}
              className="mt-6 w-full h-12 rounded-xl bg-gradient-hero text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {submitting ? "Envoi en cours..." : "Envoyer l'alerte ⚡"}
            </Button>
            <Button variant="outline" onClick={() => setStep(3)} className="mt-2 w-full h-12 rounded-xl">
              Retour
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
