import { Node, Edge, MarkerType, XYPosition } from "reactflow";
import { GRID_UNIT } from "types/service-flow";

export const getEdgeLength = () => 5 * GRID_UNIT;

export const buildPlaceholder = ({
  id,
  matchingPlaceholder,
  position,
}: {
  id: string;
  matchingPlaceholder?: Node;
  position?: XYPosition;
}): Node => {
  if (!matchingPlaceholder && !position) throw Error("Either matchingPlaceholder or position have to be defined.");

  const positionX = position ? position.x : matchingPlaceholder!.position.x;
  const positionY = position ? position.y : matchingPlaceholder!.position.y + (matchingPlaceholder!.height ?? 0);

  return {
    id,
    type: "placeholder",
    position: {
      x: positionX,
      y: getEdgeLength() + positionY,
    },
    data: {
      type: "placeholder",
    },
    className: "placeholder",
    selectable: false,
    draggable: false,
  };
};

export const buildEdge = ({
  id,
  source,
  sourceHandle,
  target,
}: {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
}): Edge => {
  return {
    id,
    sourceHandle,
    source,
    target,
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  };
};
