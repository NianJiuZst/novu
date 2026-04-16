import { CreateDomain } from './create-domain/create-domain.usecase';
import { CreateRoute } from './create-route/create-route.usecase';
import { DeleteDomain } from './delete-domain/delete-domain.usecase';
import { DeleteRoute } from './delete-route/delete-route.usecase';
import { GetDomain } from './get-domain/get-domain.usecase';
import { GetDomains } from './get-domains/get-domains.usecase';
import { UpdateRoute } from './update-route/update-route.usecase';
import { VerifyDomain } from './verify-domain/verify-domain.usecase';

export const USE_CASES = [
  CreateDomain,
  GetDomains,
  GetDomain,
  DeleteDomain,
  VerifyDomain,
  CreateRoute,
  UpdateRoute,
  DeleteRoute,
];

export { CreateDomain, CreateRoute, DeleteDomain, DeleteRoute, GetDomain, GetDomains, UpdateRoute, VerifyDomain };
