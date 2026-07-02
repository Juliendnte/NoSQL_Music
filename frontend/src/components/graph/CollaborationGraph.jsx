import { useEffect, useRef } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import { select, pointer } from "d3-selection";
import { drag } from "d3-drag";
import { zoom, zoomIdentity } from "d3-zoom";

const WIDTH = 800;
const HEIGHT = 520;
const NODE_BASE_RADIUS = 14;

// Renders the artist collaboration graph as an SVG force-directed layout.
// D3 owns the simulation/DOM updates imperatively (ticks run far more often
// than React should re-render); React only mounts the <svg> shell once.
export function CollaborationGraph({ nodes, edges, onSelectArtist }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!nodes?.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const simNodes = nodes.map((n) => ({ ...n }));
    const simEdges = edges.map((e) => ({ ...e }));

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const root = svg.append("g");

    const linkGroup = root.append("g").attr("stroke", "rgba(255,255,255,0.18)");
    const nodeGroup = root.append("g");

    const link = linkGroup
      .selectAll("line")
      .data(simEdges)
      .join("line")
      .attr("stroke-width", (d) => 1 + Math.min(d.weight ?? 1, 4));

    const node = nodeGroup
      .selectAll("g")
      .data(simNodes, (d) => d.id)
      .join("g")
      .style("cursor", "pointer")
      .call(
        drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.25).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            const [x, y] = pointer(event, root.node());
            d.fx = x;
            d.fy = y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (_event, d) => onSelectArtist?.(d.id))
      .on("mouseenter", (_event, d) => highlight(d.id))
      .on("mouseleave", () => highlight(null));

    node
      .append("circle")
      .attr("r", (d) => NODE_BASE_RADIUS + Math.min(d.connections ?? 0, 6) * 2)
      .attr("fill", "#1c1c1c")
      .attr("stroke", "rgba(255,255,255,0.5)")
      .attr("stroke-width", 1.5);

    node
      .append("text")
      .text((d) => d.name)
      .attr("x", 0)
      .attr("y", (d) => NODE_BASE_RADIUS + Math.min(d.connections ?? 0, 6) * 2 + 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#fafafa")
      .attr("font-size", 12)
      .attr("font-family", "'DM Sans', system-ui, sans-serif")
      .style("pointer-events", "none");

    node.append("title").text((d) => `${d.name} — ${d.connections ?? 0} collaboration(s)`);

    function highlight(id) {
      node
        .select("circle")
        .attr("fill", (d) => (d.id === id ? "#c6ff3a" : "#1c1c1c"))
        .attr("stroke", (d) => (d.id === id ? "#c6ff3a" : "rgba(255,255,255,0.5)"));
      link.attr("stroke", (d) => {
        if (!id) return "rgba(255,255,255,0.18)";
        const sourceId = d.source.id ?? d.source;
        const targetId = d.target.id ?? d.target;
        return sourceId === id || targetId === id ? "#c6ff3a" : "rgba(255,255,255,0.08)";
      });
    }

    const simulation = forceSimulation(simNodes)
      .force(
        "link",
        forceLink(simEdges)
          .id((d) => d.id)
          .distance(110)
          .strength(0.6)
      )
      .force("charge", forceManyBody().strength(-260))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collide", forceCollide(NODE_BASE_RADIUS + 24));

    if (reducedMotion) simulation.alphaDecay(0.3);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    const zoomBehavior = zoom()
      .scaleExtent([0.6, 2.5])
      .on("zoom", (event) => root.attr("transform", event.transform));
    svg.call(zoomBehavior).call(zoomBehavior.transform, zoomIdentity);

    return () => simulation.stop();
  }, [nodes, edges, onSelectArtist]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Graphe des collaborations entre artistes"
      className="h-[420px] w-full rounded-xl border border-border bg-surface sm:h-[520px]"
    />
  );
}
