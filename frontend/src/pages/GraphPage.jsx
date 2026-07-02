import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CollaborationGraph } from "../components/graph/CollaborationGraph";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Share2 } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { api } from "../api";

export function GraphPage() {
  const navigate = useNavigate();
  const { data: rawGraph, loading } = useApi(() => api.getCollaborationGraph(), []);

  // COLLABORATED_WITH is stored both ways in Neo4j (A->B and B->A), so the API
  // returns each pair twice — dedupe by unordered pair before rendering/counting.
  const graph = useMemo(() => {
    if (!rawGraph) return null;
    const seenPairs = new Set();
    const edges = [];
    for (const edge of rawGraph.edges) {
      const key = [edge.source, edge.target].sort().join("|");
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      edges.push(edge);
    }

    const connectionsById = new Map();
    for (const edge of edges) {
      connectionsById.set(edge.source, (connectionsById.get(edge.source) ?? 0) + 1);
      connectionsById.set(edge.target, (connectionsById.get(edge.target) ?? 0) + 1);
    }

    const nodes = rawGraph.nodes.map((n) => ({ id: n.id, name: n.label, connections: connectionsById.get(n.id) ?? 0 }));
    return { nodes, edges };
  }, [rawGraph]);

  const nameById = useMemo(() => {
    const map = new Map();
    for (const node of graph?.nodes ?? []) map.set(node.id, node.name);
    return map;
  }, [graph]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Graphe des collaborations</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Glissez un nœud pour le repositionner, molette pour zoomer, clic pour ouvrir un artiste.
        </p>
      </div>

      {loading && <Spinner />}

      {!loading && !graph?.nodes?.length && (
        <EmptyState icon={Share2} title="Aucune donnée de graphe" description="Importez des artistes pour construire le graphe." />
      )}

      {!loading && graph?.nodes?.length > 0 && (
        <>
          <CollaborationGraph
            nodes={graph.nodes}
            edges={graph.edges}
            onSelectArtist={(id) => navigate(`/artists/${id}`, { state: { name: nameById.get(id) } })}
          />

          {/* Accessible alternative: node-link graphs can't be conveyed to screen readers or via color alone. */}
          <section aria-labelledby="adjacency-heading" className="flex flex-col gap-3">
            <h2 id="adjacency-heading" className="text-lg font-semibold text-foreground">
              Table des collaborations
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted text-foreground-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Artiste</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Collabore avec</th>
                  </tr>
                </thead>
                <tbody>
                  {graph.edges.map((edge, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-2.5 text-foreground">{nameById.get(edge.source) ?? edge.source}</td>
                      <td className="px-4 py-2.5 text-foreground">{nameById.get(edge.target) ?? edge.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
