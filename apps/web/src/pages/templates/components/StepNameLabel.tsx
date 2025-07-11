import { Center } from '@mantine/core';
import { colors, Text, Variant, VariantsFile } from '@novu/design-system';
import { useStepIndex } from '../hooks/useStepIndex';
import { useStepInfoPath } from '../hooks/useStepInfoPath';
import { useStepVariantsCount } from '../hooks/useStepVariantsCount';

export const StepNameLabel = () => {
  const { variantIndex } = useStepIndex();
  const { isUnderTheStepPath, isUnderVariantPath } = useStepInfoPath();
  const { variantsCount } = useStepVariantsCount();

  if (isUnderTheStepPath) {
    return null;
  }

  const variantArrayIndex = variantIndex ? variantIndex + 1 : 1;
  const text = isUnderVariantPath ? `Variant ${variantArrayIndex}` : `${variantsCount} variants`;

  return (
    <Center inline>
      {isUnderVariantPath ? <Variant /> : <VariantsFile />}
      <Text ml={4} color={colors.B60}>
        {text}
      </Text>
    </Center>
  );
};
