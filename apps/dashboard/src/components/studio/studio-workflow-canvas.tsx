import { Background, BackgroundVariant, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DiscoverStepOutput } from '@/types/studio';
import { StepTypeEnum } from '@/utils/enums';
import { buildRoute, ROUTES } from '@/utils/routes';
import { NODE_WIDTH } from '../workflow-editor/base-node';
import { CanvasContext } from '../workflow-editor/drag-context';
import { edgeTypes, nodeTypes } from '../workflow-editor/node-utils';

type StudioWorkflowCanvasChildProps = {
  steps: DiscoverStepOutput[];
  workflowId: string;
};

const stepTypeMap: Record<string, StepTypeEnum> = {
  email: StepTypeEnum.EMAIL,
  in_app: StepTypeEnum.IN_APP,
  sms: StepTypeEnum.SMS,
  chat: StepTypeEnum.CHAT,
  push: StepTypeEnum.PUSH,
  digest: StepTypeEnum.DIGEST,
  delay: StepTypeEnum.DELAY,
  throttle: StepTypeEnum.THROTTLE,
  custom: StepTypeEnum.CUSTOM,
};

function convertStepsToNodesAndEdges(steps: DiscoverStepOutput[]) {
  const nodes = [];
  const edges = [];
  const NODE_SPACING = 100;

  nodes.push({
    id: 'trigger',
    type: 'trigger',
    position: { x: 0, y: 0 },
    data: { triggerLink: '' },
  });

  steps.forEach((step, index) => {
    const yPosition = (index + 1) * NODE_SPACING;
    const nodeType = stepTypeMap[step.type] || StepTypeEnum.CUSTOM;

    nodes.push({
      id: `step-${index}`,
      type: nodeType.toLowerCase(),
      position: { x: 0, y: yPosition },
      data: {
        index,
        name: step.stepId,
        stepSlug: step.stepId,
        content: `${step.stepId}`,
      },
    });

    const sourceId = index === 0 ? 'trigger' : `step-${index - 1}`;
    edges.push({
      id: `edge-${sourceId}-step-${index}`,
      source: sourceId,
      target: `step-${index}`,
      type: 'workflow',
    });
  });

  return { nodes, edges };
}

const StudioWorkflowCanvasChild = ({ steps, workflowId }: StudioWorkflowCanvasChildProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const navigate = useNavigate();
  const location = useLocation();

  const { nodes, edges } = useMemo(() => convertStepsToNodesAndEdges(steps), [steps]);

  const positionCanvas = useCallback(() => {
    const clientWidth = reactFlowWrapper.current?.clientWidth;
    const middle = clientWidth ? clientWidth / 2 - NODE_WIDTH / 2 : 0;

    reactFlowInstance.setViewport({ x: middle, y: 50, zoom: 0.99 });
  }, [reactFlowInstance]);

  useEffect(() => {
    const listener = () => positionCanvas();

    window.addEventListener('resize', listener);

    return () => {
      window.removeEventListener('resize', listener);
    };
  }, [positionCanvas]);

  useLayoutEffect(() => {
    positionCanvas();
  }, [positionCanvas]);

  const canvasContextValue = useMemo(
    () => ({
      isReadOnly: true,
      showStepPreview: false,
      onNodeDragStart: () => {},
      onNodeDragMove: () => {},
      onNodeDragEnd: () => {},
      draggedNodeId: null,
      intersectingNodeId: null,
      intersectingEdgeId: null,
      updateEdges: () => {},
      removeEdges: () => {},
      copyNode: () => {},
      addNode: () => {},
      removeNode: () => {},
      selectNode: (id: string) => {
        const stepIndex = parseInt(id.replace('step-', ''), 10);
        if (!Number.isNaN(stepIndex) && steps[stepIndex]) {
          const searchParams = new URLSearchParams(location.search);
          navigate({
            pathname: buildRoute(ROUTES.STUDIO_STEP_EDITOR, {
              workflowId,
              stepId: steps[stepIndex].stepId,
            }),
            search: searchParams.toString(),
          });
        }
      },
      unselectNode: () => {},
      selectedNodeId: undefined,
    }),
    [steps, workflowId, navigate, location.search]
  );

  return (
    <CanvasContext.Provider value={canvasContextValue}>
      <div ref={reactFlowWrapper} className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={null}
          maxZoom={1}
          minZoom={0.9}
          panOnScroll
          selectionOnDrag
          panOnDrag={[1, 2]}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            bgColor="hsl(var(--bg-weak))"
            color="hsl(var(--bg-muted))"
          />
        </ReactFlow>
      </div>
    </CanvasContext.Provider>
  );
};

type StudioWorkflowCanvasProps = {
  steps: DiscoverStepOutput[];
  workflowId: string;
};

export const StudioWorkflowCanvas = ({ steps, workflowId }: StudioWorkflowCanvasProps) => {
  return (
    <ReactFlowProvider>
      <div className="relative h-full w-full">
        <StudioWorkflowCanvasChild steps={steps} workflowId={workflowId} />
      </div>
    </ReactFlowProvider>
  );
};
