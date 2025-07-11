import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditTranslationsSidebar } from '../components/EditTranslationsSidebar';
import { EditTranslationFileProvider } from '../context/useEditTranslationFileContext';
import { ROUTES } from '../routes';

export function EditGroupTranslationsPage() {
  const { identifier } = useParams();
  const navigate = useNavigate();

  const onClose = () => {
    navigate(ROUTES.HOME);
  };

  const onEditGroup = (groupIdentifier: string) => {
    navigate(`/translations/edit/${groupIdentifier}/settings`);
  };

  if (!identifier) {
    return null;
  }

  return (
    <EditTranslationFileProvider>
      <EditTranslationsSidebar open onEditGroup={onEditGroup} onClose={onClose} identifier={identifier} />;
    </EditTranslationFileProvider>
  );
}
