import { type IMustacheVariable, type ITemplateVariable, TemplateVariableTypeEnum } from '@novu/shared';
import get from 'lodash.get';
import set from 'lodash.set';
import { useMemo } from 'react';

const processVariables = (variables: IMustacheVariable[]) => {
  const varsObj: Record<string, any> = {};

  variables
    .filter((variable) => variable.type !== TemplateVariableTypeEnum.ARRAY)
    .forEach((variable) => {
      set(varsObj, variable.name, getVariableValue(variable));
    });

  variables
    .filter((variable) => variable.type === TemplateVariableTypeEnum.ARRAY)
    .forEach((variable) => {
      set(varsObj, variable.name, [get(varsObj, variable.name, [])]);
    });

  return JSON.stringify(varsObj, null, 2);
};

const getVariableValue = (variable: IMustacheVariable) => {
  if (variable.type === TemplateVariableTypeEnum.BOOLEAN) {
    return variable.defaultValue;
  }
  if (variable.type === TemplateVariableTypeEnum.STRING) {
    return variable.defaultValue ? variable.defaultValue : variable.name;
  }

  if (variable.type === TemplateVariableTypeEnum.ARRAY) {
    return [];
  }

  return '';
};

export const useProcessVariables = (variables: ITemplateVariable[] | undefined = [], asString = true) => {
  return useMemo(() => {
    let processed = processVariables(variables);

    if (!asString) {
      processed = JSON.parse(processed);
    }

    return processed;
  }, [variables, asString]);
};
