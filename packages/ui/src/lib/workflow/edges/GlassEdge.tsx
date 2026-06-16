import { BaseEdge, getBezierPath, EdgeProps } from "@xyflow/react";

export function GlassEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: "rgba(99, 102, 241, 0.4)",
          strokeWidth: 2,
          filter: "drop-shadow(0 0 4px rgba(99, 102, 241, 0.2))",
        }}
      />
      {label && (
        <foreignObject x={labelX - 20} y={labelY - 10} width={40} height={20} className="pointer-events-none">
          <span className="text-[8px] font-bold text-[#475569] bg-[#12121a] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">
            {label}
          </span>
        </foreignObject>
      )}
    </>
  );
}
