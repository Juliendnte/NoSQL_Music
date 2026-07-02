import { Link } from "react-router-dom";
import { CompassIcon } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFoundPage() {
  return (
    <EmptyState
      icon={CompassIcon}
      title="Page introuvable"
      description="Cette page n'existe pas."
      action={
        <Link to="/" className="text-sm font-medium text-accent hover:underline">
          Retour à l'accueil
        </Link>
      }
    />
  );
}
