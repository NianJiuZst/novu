import { UiComponentEnum } from '@novu/shared';
import { expect } from 'chai';
import {
  FRAMEWORK_EMPTY_STEP_RESOLVER_SCHEMA,
  reconcileStepResolverControlValues,
  STEP_RESOLVER_EMAIL_UI_SCHEMA,
} from './step-resolver-control-state';

describe('step-resolver-control-state', () => {
  it('should keep reserved control values including layoutId', () => {
    const reconciled = reconcileStepResolverControlValues(
      {
        editorType: 'html',
        rendererType: 'react-email',
        layoutId: 'marketing-layout',
      },
      FRAMEWORK_EMPTY_STEP_RESOLVER_SCHEMA
    );

    expect(reconciled).to.deep.equal({
      editorType: 'html',
      rendererType: 'react-email',
      layoutId: 'marketing-layout',
    });
  });

  it('should remove invalid resolver fields and keep reserved controls', () => {
    const reconciled = reconcileStepResolverControlValues(
      {
        editorType: 'html',
        rendererType: 'react-email',
        layoutId: 'product-layout',
        subject: 42,
        staleField: true,
      },
      {
        type: 'object',
        properties: {
          subject: {
            type: 'string',
          },
        },
        additionalProperties: false,
      }
    );

    expect(reconciled).to.deep.equal({
      editorType: 'html',
      rendererType: 'react-email',
      layoutId: 'product-layout',
    });
  });

  it('should expose layout selector in step resolver ui schema', () => {
    expect(STEP_RESOLVER_EMAIL_UI_SCHEMA.properties?.layoutId?.component).to.equal(UiComponentEnum.LAYOUT_SELECT);
  });
});
