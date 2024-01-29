import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  NodeChange,
  NodeDimensionChange,
  OnEdgesChange,
  OnNodesChange,
  useUpdateNodeInternals,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode from "../Steps/CustomNode";
import PlaceholderNode from "../Steps/PlaceholderNode";
import { ConditionRuleType, StepType } from "../../types";
import StartNode from "../Steps/StartNode";
import { useTranslation } from "react-i18next";
import useServiceStore from "store/new-services.store";
import { GRID_UNIT } from "types/service-flow";
import { buildEdge, buildPlaceholder, getEdgeLength } from "services/flow-builder";

const nodeTypes = {
  startNode: StartNode,
  customNode: CustomNode,
  placeholder: PlaceholderNode,
};

type FlowBuilderProps = {
  updatedRules: { rules: (string | null)[]; rulesData: ConditionRuleType[] };
  nodes: Node[];
  onNodesChange?: OnNodesChange;
  onNodeAdded: () => void;
  edges: Edge[];
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  onEdgesChange?: OnEdgesChange;
  description: string;
};

const FlowBuilder: FC<FlowBuilderProps> = ({
  updatedRules,
  nodes,
  setNodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange,
  onNodeAdded,
  description,}) => {
  const { t } = useTranslation();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const clickedNode = useServiceStore(state => state.clickedNode);
  const setClickedNode = useServiceStore(state => state.setClickedNode);
  const startDragNode = useRef<Node | undefined>(undefined);
  const nodePositionOffset = 28 * GRID_UNIT;
  const updateNodeInternals = useUpdateNodeInternals();

  const reactFlowInstance = useServiceStore(state => state.reactFlowInstance);
  const setReactFlowInstance = useServiceStore(state => state.setReactFlowInstance);
  const handleNodeEdit = useServiceStore.getState().handleNodeEdit;

  useEffect(() => {
    useServiceStore.getState().setFlow(JSON.stringify(reactFlowInstance?.toObject()));
  }, [reactFlowInstance]);


  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.type !== "customNode") return node;
        node.data = {
          ...node.data,
          onDelete,
          onEdit: handleNodeEdit,
          setClickedNode,
          update: updateInputRules,
        };
        return node;
      })
    );
  }, [reactFlowInstance]);

  // Align nodes in case any got overlapped
  const alignNodes = (nodeChanges: NodeChange[]) => {
    setNodes((prevNodes) => {
      // Find node following every updated node to see if it overlaps
      nodeChanges.forEach((nodeChange: NodeChange) => {
        if (nodeChange.type !== "dimensions") return;
        const nodeId = (nodeChange as NodeDimensionChange).id;
        const updatedNode = prevNodes.find((node) => node.id === nodeId);
        if (!updatedNode) return;
        const edgesAfterNode = edges.filter((edge) => edge.source === updatedNode.id).map((edge) => edge.target);
        if (edgesAfterNode.length === 0) return;
        const followingNodes = prevNodes.filter((node) => edgesAfterNode.includes(node.id));
        if (followingNodes.length === 0) return;

        followingNodes.forEach((node) => {
          // If this node is overlapped by the previous one, pull it down
          if (node.position.y <= updatedNode.position.y + (updatedNode.height ?? 0)) {
            node.position.y = getEdgeLength() + updatedNode.position.y + (updatedNode.height ?? 0);
          }
        });
      });
      return prevNodes;
    });
  };

  const buildRuleWithPlaceholder = ({
    id,
    offset,
    inputNode,
    label,
    name,
    condition,
    value,
  }: {
    id: number;
    offset: number;
    inputNode: Node;
    label: string;
    name?: string;
    condition?: string;
    value?: string;
  }): Node[] => {
    const positionX = inputNode.position.x;
    const positionY = getEdgeLength() + inputNode.position.y + (inputNode.height ?? 0);

    return [
      {
        id: `${id}`,
        position: {
          x: positionX + offset,
          y: positionY,
        },
        type: "customNode",
        data: {
          label,
          onDelete,
          onEdit: handleNodeEdit,
          type: "rule",
          stepType: StepType.Rule,
          readonly: true,
          name,
          condition,
          value,
        },
        className: "rule",
      },
      buildPlaceholder({
        id: `${id + 1}`,
        position: { x: positionX + offset, y: positionY + (inputNode.height ?? 0) },
      }),
    ];
  };

  const buildRuleEdges = ({
    inputId,
    targetId,
    handleId,
    placeholderId,
  }: {
    inputId: number;
    targetId: number;
    handleId: number;
    placeholderId?: string;
  }): Edge[] => {
    return [
      // input -> rule
      buildEdge({
        id: `edge-${inputId}-${targetId}`,
        source: `${inputId}`,
        sourceHandle: `handle-${inputId}-${handleId}`,
        target: `${targetId}`,
      }),
      // rule -> placeholder
      buildEdge({
        id: `edge-${targetId}-${placeholderId ?? targetId + 1}`,
        source: `${targetId}`,
        sourceHandle: `handle-${targetId}-0`,
        target: `${placeholderId ?? targetId + 1}`,
      }),
    ];
  };


  // Move the placeholder together with the node being moved
  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, draggedNode: Node) => {
      const draggedEdges = edges.filter((edge) => edge.source === draggedNode.id);
      if (draggedEdges.length === 0) return;
      const placeholders = nodes.filter(
        (node) => draggedEdges.map((edge) => edge.target).includes(node.id) && node.type === "placeholder"
      );
      // only drag placeholders following the node
      if (placeholders.length === 0) return;

      setNodes((prevNodes) =>
        prevNodes.map((prevNode) => {
          placeholders.forEach((placeholder) => {
            if (prevNode.id !== placeholder.id) return;
            prevNode.position.x = draggedNode.position.x;
            prevNode.position.y = getEdgeLength() + draggedNode.position.y + (draggedNode.height ?? 0);
          });
          return prevNode;
        })
      );
    },
    [edges, nodes]
  );

  const onNodeDragStart = useCallback(
    (_: any, draggedNode: Node) => {
      if (!reactFlowInstance || !reactFlowWrapper.current) return;
      startDragNode.current = draggedNode;
      // setStartDragNode((draggedNode) => [...startDragNode, ...draggedNode]);
    },
    [reactFlowInstance, edges]
  );

  // Dragging existing node onto placeholder
  const onNodeDragStop = useCallback(
    (event: any, draggedNode: Node) => {
      if (!reactFlowInstance || !reactFlowWrapper.current) return;
      // Check if node was dropped on a placeholder
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (reactFlowInstance.getIntersectingNodes(draggedNode).length > 0) {
        if (startDragNode.current != undefined) {
          setNodes((prevNodes) =>
            prevNodes.map((node) => {
              if (node.id !== draggedNode.id) return node;
              node.position.x = startDragNode.current?.position.x ?? 0;
              node.position.y = startDragNode.current?.position.y ?? 0;
              return node;
            })
          );
        }
      }

      const matchingPlaceholder = reactFlowInstance.getNodes().find((node) => {
        if (node.type !== "placeholder") return false;
        return (
          node.position.x <= position.x &&
          position.x <= node.position.x + node.width! &&
          node.position.y <= position.y &&
          position.y <= node.position.y + node.height!
        );
      });
      if (!matchingPlaceholder) return;

      // If an existing edge is already pointing to node, then it cannot be attached
      const edgeToNode = edges.find((edge) => edge.target === draggedNode.id);
      if (edgeToNode) return;

      // Delete matching placeholder and set node's position to match
      setNodes((prevNodes) =>
        prevNodes
          .filter((node) => node.id !== matchingPlaceholder.id)
          .map((node) => {
            if (node.id !== draggedNode.id) return node;
            node.position.x = matchingPlaceholder.position.x;
            node.position.y = matchingPlaceholder.position.y;
            return node;
          })
      );
      // Remove old edge and create a new one pointing to draggedNode
      setEdges((prevEdges) => {
        const toRemove = prevEdges.find((edge) => edge.target === matchingPlaceholder.id);
        if (!toRemove) return prevEdges;
        return [
          ...prevEdges.filter((edge) => edge !== toRemove),
          buildEdge({
            id: `edge-${toRemove.source}-${draggedNode.id}`,
            source: toRemove.source,
            sourceHandle: `handle-${toRemove.source}-1`,
            target: draggedNode.id,
          }),
        ];
      });
      startDragNode.current = undefined;
    },
    [reactFlowInstance, edges]
  );

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Dragging and dropping the element from the list on the left
  // onto the placeholder node adds it to the flow
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      // Find matching placeholder
      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const [label, type] = [
        event.dataTransfer.getData("application/reactflow-label"),
        event.dataTransfer.getData("application/reactflow-type") as StepType,
      ];
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const matchingPlaceholder = reactFlowInstance.getNodes().find((node) => {
        if (node.type !== "placeholder") return false;
        return (
          node.position.x <= position.x &&
          position.x <= node.position.x + node.width! &&
          node.position.y <= position.y &&
          position.y <= node.position.y + node.height!
        );
      });
      if (!matchingPlaceholder) return;
      const connectedNodeEdge = reactFlowInstance.getEdges().find((edge) => edge.target === matchingPlaceholder.id);
      if (!connectedNodeEdge) return;

      setNodes((prevNodes) => {
        const newNodeId = matchingPlaceholder.id;
        const newPlaceholderId = Math.max(...nodes.map((node) => +node.id)) + 1;
        setEdges((prevEdges) => {
          // Point edge from previous node to new node
          const newEdges = [
            ...prevEdges.filter((edge) => edge.target !== matchingPlaceholder.id),
            buildEdge({
              id: connectedNodeEdge.id!,
              source: connectedNodeEdge.source,
              sourceHandle: connectedNodeEdge.sourceHandle,
              target: newNodeId,
            }),
          ];

          if (![StepType.Input, StepType.FinishingStepEnd, StepType.FinishingStepRedirect].includes(type)) {
            // Point edge from new node to new placeholder
            newEdges.push(
              buildEdge({
                id: `edge-${newNodeId}-${newPlaceholderId + 1}`,
                source: newNodeId,
                sourceHandle: `handle-${newNodeId}-0`,
                target: `${newPlaceholderId + 1}`,
              })
            );
          }
          return newEdges;
        });

        // Add new node in place of old placeholder
        const prevClientInputs = prevNodes.filter((node) => node.data.stepType === "input");
        const newClientInputId = (prevClientInputs[prevClientInputs.length - 1]?.data.clientInputId ?? 0) + 1;
        const newNodes = [
          ...prevNodes.filter((node) => node.id !== matchingPlaceholder.id),
          {
            id: `${newNodeId}`,
            position: matchingPlaceholder.position,
            type: "customNode",
            data: {
              label: type === "input" ? `${label} - ${newClientInputId}` : label,
              onDelete,
              onEdit: handleNodeEdit,
              type: [StepType.FinishingStepEnd, StepType.FinishingStepRedirect].includes(type)
                ? "finishing-step"
                : "step",
              stepType: type,
              clientInputId: type === StepType.Input ? newClientInputId : undefined,
              readonly: [
                StepType.Auth,
                StepType.FinishingStepEnd,
                StepType.FinishingStepRedirect,
                StepType.UserDefined,
              ].includes(type),
              childrenCount: type === StepType.Input ? 0 : 1,
              setClickedNode,
              update: updateInputRules,
              message: setDefaultMessages(type),
            },
            className: [StepType.FinishingStepEnd, StepType.FinishingStepRedirect].includes(type)
              ? "finishing-step"
              : "step",
          },
        ];

        if (![StepType.Input, StepType.FinishingStepEnd, StepType.FinishingStepRedirect].includes(type)) {
          // Add placeholder right below new node
          newNodes.push(
            buildPlaceholder({
              id: `${newPlaceholderId + 1}`,
              matchingPlaceholder,
            })
          );
        }

        return newNodes;
      });
      onNodeAdded();
    },
    [reactFlowInstance, nodes, edges]
  );

  const setDefaultMessages = (stepType: StepType) => {
    switch (stepType) {
      case StepType.FinishingStepEnd:
        return t("serviceFlow.popup.serviceEnded");
      case StepType.FinishingStepRedirect:
        return t("serviceFlow.popup.redirectToCustomerSupport");
    }
  };

  useEffect(() => {
    if (updatedRules.rules.length === 0) return;
    updateInputRules(updatedRules);
  }, [updatedRules]);

  const updateInputRules = useCallback(
    (updatedRules: { rules: (string | null)[]; rulesData: ConditionRuleType[] }) => {
      if (!clickedNode) return;
      // Find rules not included in updatedRules
      const oldRules = edges.filter((edge) => edge.source === clickedNode).map((edge) => edge.target);
      const nodesToRemove: string[] = nodes
        .filter((node) => oldRules.includes(node.id) && !updatedRules.rules.includes(node.id))
        .map((node) => node.id);
      // Find placeholders after rules to be removed
      edges
        .filter((edge) => nodesToRemove.includes(edge.source))
        .forEach((edge) => {
          const placeholder = nodes.find((node) => node.id === edge.target && node.type === "placeholder");
          if (placeholder) nodesToRemove.push(placeholder.id);
        });
      let newRules: string[] = [];
      let updatedNodes: Node[] = [];

      setNodes((prevNodes) => {
        // Remove deleted nodes and placeholders after them
        // Set client input node handle amount to match new rules
        const newNodes = prevNodes
          .filter((node) => !nodesToRemove.includes(node.id))
          .map((node) => {
            if (node.id !== clickedNode) return node;
            node.data.childrenCount = updatedRules.rules.length;
            return node;
          });
        updateNodeInternals(clickedNode);
        const inputNode = prevNodes.find((node) => node.id === clickedNode);
        if (!inputNode) return prevNodes;

        let offsetLeft = nodePositionOffset * Math.floor(newRules.length / 2);
        if (newRules.length % 2 === 0) offsetLeft -= nodePositionOffset / 2;
        const newPlaceholderId = Math.max(...nodes.map((node) => +node.id)) + 1;

        let placedRuleCount = -1;
        newRules = updatedRules.rules.map((rule, i) => {
          placedRuleCount++;
          const offset = -offsetLeft + placedRuleCount * nodePositionOffset;
          const ruleData = updatedRules.rulesData[i];
          if (rule === null) {
            // Create new rule node with placeholder
            const newRuleId = newPlaceholderId + i * 2;
            newNodes.push(
              ...buildRuleWithPlaceholder({
                id: newRuleId,
                label: `rule ${i + 1}`,
                offset,
                inputNode,
                name: ruleData?.name,
                condition: ruleData?.condition,
                value: ruleData?.value,
              })
            );
            return `${newRuleId}`;
          } else {
            // Move existing rule node with following node to keep them in order
            const ruleNode = newNodes.find((node) => node.id === rule);
            if (!ruleNode) return rule;
            ruleNode.data.label = `rule ${i + 1}`;
            ruleNode.position.x = inputNode.position.x + offset;
            ruleNode.data.name = ruleData?.name;
            ruleNode.data.condition = ruleData?.condition;
            ruleNode.data.value = ruleData?.value;

            const ruleEdge = edges.find((edge) => edge.source === rule);
            if (!ruleEdge) return rule;

            const ruleFollowingNode = newNodes.find((node) => node.id === ruleEdge.target);
            if (!ruleFollowingNode) return rule;

            ruleFollowingNode.position.x = inputNode.position.x + offset;
            return rule;
          }
        });
        updatedNodes = newNodes;
        return newNodes;
      });
      setEdges((prevEdges) => {
        const newEdges: Edge[] = prevEdges.filter(
          (edge) =>
            !newRules.includes(edge.target) &&
            !newRules.includes(edge.source) &&
            !nodesToRemove.includes(edge.source) &&
            !nodesToRemove.includes(edge.target)
        );
        // Add new edges to connect new rules and placeholders
        newRules.forEach((rule, i) => {
          if (rule === null) return;
          const oldEdgeAfterNewRule = prevEdges.find((edge) => edge.source === rule);
          const nodeAfterNewRule = updatedNodes.find((node) => node.id === oldEdgeAfterNewRule?.target);
          newEdges.push(
            ...buildRuleEdges({
              inputId: +clickedNode!,
              targetId: +rule!,
              handleId: i,
              placeholderId: nodeAfterNewRule?.id,
            })
          );
        });
        return newEdges;
      });
    },
    [edges, nodes]
  );

  return (
    <div className={description.length > 0 ? "graph__bodyWithDescription" : "graph__body"} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes: NodeChange[]) => {
          onNodesChange?.(changes);
          alignNodes(changes);
        }}
        onEdgesChange={onEdgesChange}
        snapToGrid
        snapGrid={[GRID_UNIT, GRID_UNIT]}
        defaultViewport={{ x: 38 * GRID_UNIT, y: 3 * GRID_UNIT, zoom: 0 }}
        panOnScroll
        nodeTypes={nodeTypes}
        onInit={setReactFlowInstance}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeDragStart={onNodeDragStart}
        onNodeMouseEnter={(_, node) => {
          setNodes((prevNodes) =>
            prevNodes.map((prevNode) => {
              if (prevNode.type === "customNode" && prevNode.data === node.data) {
                prevNode.selected = true;
                prevNode.className = "selected";
              }
              return prevNode;
            })
          );
        }}
        onNodeMouseLeave={(_, node) => {
          setNodes((prevNodes) =>
            prevNodes.map((prevNode) => {
              if (prevNode.type === "customNode" && prevNode.data === node.data) {
                prevNode.selected = false;
                prevNode.className = prevNode.data.type;
              }
              return prevNode;
            })
          );
        }}
      >
        <Controls />
        <MiniMap />
        <Background color="#D2D3D8" gap={16} lineWidth={2} />
      </ReactFlow>
    </div>
  );
};

export default FlowBuilder;
