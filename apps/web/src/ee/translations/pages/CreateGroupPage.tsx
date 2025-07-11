import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateGroupSidebar } from '../components/CreateGroupSidebar';
import { ROUTES } from '../routes';

export function CreateGroupPage() {
  const navigate = useNavigate();

  const onClose = () => {
    navigate(ROUTES.HOME);
  };

  const onGroupCreated = (groupIdentifier: string) => {
    navigate(`/translations/edit/${groupIdentifier}`);
  };

  return <CreateGroupSidebar open onClose={onClose} onGroupCreated={onGroupCreated} />;
}
