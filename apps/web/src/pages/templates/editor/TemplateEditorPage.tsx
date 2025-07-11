import { isBridgeWorkflow, type ResourceTypeEnum } from '@novu/shared';
import { useEffect, useState } from 'react';
import { ReactFlowProvider } from 'react-flow-renderer';
import { useFormContext } from 'react-hook-form';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageContainer from '../../../components/layout/components/PageContainer';
import { ROUTES } from '../../../constants/routes';
import { useEnvironment, usePrompt } from '../../../hooks';
import { WorkflowDetailFormContextProvider } from '../../../studio/components/workflows/preferences/WorkflowDetailFormContextProvider';
import { BlueprintModal } from '../components/BlueprintModal';
import type { IForm } from '../components/formTypes';
import { NavigateValidatorModal } from '../components/NavigateValidatorModal';
import { TemplateEditorFormProvider, useTemplateEditorForm } from '../components/TemplateEditorFormProvider';
import { TemplateDetailsPageV2 } from '../editor_v2/TemplateDetailsPageV2';
import { useBasePath } from '../hooks/useBasePath';
import { useTourStorage } from '../hooks/useTourStorage';
import WorkflowEditor from '../workflow/WorkflowEditor';
import { TourProvider } from './TourProvider';

function BaseTemplateEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { template, isCreating, onSubmit, onInvalid } = useTemplateEditorForm();
  const { environment, bridge } = useEnvironment({ bridge: template?.bridge });
  const methods = useFormContext<IForm>();
  const { handleSubmit } = methods;
  const tourStorage = useTourStorage();
  const { templateId = '' } = useParams<{ templateId: string }>();
  const isTouring = tourStorage.getCurrentTour('digest', templateId) > -1;
  const basePath = useBasePath();
  const [shouldRenderBlueprintModal, setShouldRenderBlueprintModal] = useState(false);

  const isCreateTemplatePage = location.pathname === ROUTES.WORKFLOWS_CREATE;

  const [showNavigateValidatorModal, confirmNavigate, cancelNavigate] = usePrompt(
    !methods.formState.isValid && !bridge && location.pathname !== ROUTES.WORKFLOWS_CREATE && !isTouring,
    (nextLocation) => {
      if (nextLocation.location.pathname.includes(basePath)) {
        nextLocation.retry();

        return false;
      }

      return true;
    }
  );

  const onSubmitHandler = async (data: IForm) => {
    await onSubmit(data);
  };

  useEffect(() => {
    if (environment && template && template._environmentId) {
      if (environment._id !== template._environmentId) {
        navigate(ROUTES.WORKFLOWS);
      }
    }
  }, [navigate, environment, template]);

  useEffect(() => {
    const id = localStorage.getItem('blueprintId');
    setShouldRenderBlueprintModal(!!id);
  }, []);

  if (environment && environment?.name === 'Production' && isCreateTemplatePage) {
    navigate(ROUTES.WORKFLOWS);
  }

  if (isCreating) return null;

  return (
    <>
      {!bridge && <TourProvider />}

      <PageContainer title={template?.name ?? 'Create Template'}>
        <form
          name="template-form"
          noValidate
          onSubmit={handleSubmit(onSubmitHandler, onInvalid)}
          style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr' }}
        >
          <ReactFlowProvider>
            <WorkflowEditor />
          </ReactFlowProvider>
        </form>
      </PageContainer>
      {shouldRenderBlueprintModal && <BlueprintModal />}
      <NavigateValidatorModal
        isOpen={showNavigateValidatorModal}
        onConfirm={confirmNavigate}
        onCancel={cancelNavigate}
      />
    </>
  );
}

export default function TemplateEditorPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  if (!type || !isBridgeWorkflow(type as ResourceTypeEnum)) {
    return (
      <TemplateEditorFormProvider>
        <BaseTemplateEditorPage />
      </TemplateEditorFormProvider>
    );
  } else {
    return (
      <WorkflowDetailFormContextProvider>
        <TemplateDetailsPageV2 />
      </WorkflowDetailFormContextProvider>
    );
  }
}
