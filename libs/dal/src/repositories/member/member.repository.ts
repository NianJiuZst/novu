import { Inject } from '@nestjs/common';
import { IMemberInvite, MemberRoleEnum, MemberStatusEnum } from '@novu/shared';
import { IMemberRepository } from './member-repository.interface';
import { MemberEntity } from './member.entity';

export interface IAddMemberData {
  _userId?: string;
  roles: MemberRoleEnum[];
  invite?: IMemberInvite;
  memberStatus: MemberStatusEnum;
}

export class MemberRepository implements IMemberRepository {
  constructor(@Inject('MEMBER_REPOSITORY') private _memberRepository: IMemberRepository) {}

  removeMemberById(organizationId: string, memberId: string): Promise<{ acknowledged: boolean; deletedCount: number }> {
    return this._memberRepository.removeMemberById(organizationId, memberId);
  }

  updateMemberRoles(
    organizationId: string,
    memberId: string,
    roles: MemberRoleEnum[]
  ): Promise<{ matched: number; modified: number }> {
    return this._memberRepository.updateMemberRoles(organizationId, memberId, roles);
  }

  getOrganizationMembers(organizationId: string): Promise<any[]> {
    return this._memberRepository.getOrganizationMembers(organizationId);
  }

  getOrganizationOwnerAccount(organizationId: string): Promise<MemberEntity | null> {
    return this._memberRepository.getOrganizationOwnerAccount(organizationId);
  }

  getOrganizationAdmins(organizationId: string): Promise<
    {
      _userId: any;
      user: string;
      _id: string;
      roles: MemberRoleEnum[];
      invite?: IMemberInvite | undefined;
      memberStatus: MemberStatusEnum;
      _organizationId: string;
    }[]
  > {
    return this._memberRepository.getOrganizationAdmins(organizationId);
  }

  findUserActiveMembers(userId: string): Promise<MemberEntity[]> {
    return this._memberRepository.findUserActiveMembers(userId);
  }

  convertInvitedUserToMember(
    organizationId: string,
    token: string,
    data: { memberStatus: MemberStatusEnum; _userId: string; answerDate: Date }
  ): Promise<void> {
    return this._memberRepository.convertInvitedUserToMember(organizationId, token, data);
  }

  findByInviteToken(token: string): Promise<MemberEntity | null> {
    return this._memberRepository.findByInviteToken(token);
  }

  findInviteeByEmail(organizationId: string, email: string): Promise<MemberEntity | null> {
    return this._memberRepository.findInviteeByEmail(organizationId, email);
  }

  addMember(organizationId: string, member: IAddMemberData): Promise<void> {
    return this._memberRepository.addMember(organizationId, member);
  }

  isMemberOfOrganization(organizationId: string, userId: string): Promise<boolean> {
    return this._memberRepository.isMemberOfOrganization(organizationId, userId);
  }

  findMemberByUserId(organizationId: string, userId: string): Promise<MemberEntity | null> {
    return this._memberRepository.findMemberByUserId(organizationId, userId);
  }

  findMemberById(organizationId: string, memberId: string): Promise<MemberEntity | null> {
    return this._memberRepository.findMemberById(organizationId, memberId);
  }

  create(data: any, options?: any): Promise<MemberEntity> {
    return this._memberRepository.create(data, options);
  }

  update(query: any, body: any): Promise<{ matched: number; modified: number }> {
    return this._memberRepository.update(query, body);
  }

  delete(query: any): Promise<{ acknowledged: boolean; deletedCount: number }> {
    return this._memberRepository.delete(query);
  }

  count(query: any, limit?: number): Promise<number> {
    return this._memberRepository.count(query, limit);
  }

  aggregate(query: any[], options?: { readPreference?: 'secondaryPreferred' | 'primary' }): Promise<any> {
    return this._memberRepository.aggregate(query, options);
  }

  findOne(query: any, select?: any, options?: any): Promise<MemberEntity | null> {
    return this._memberRepository.findOne(query, select, options);
  }

  find(query: any, select?: any, options?: any): Promise<MemberEntity[]> {
    return this._memberRepository.find(query, select, options);
  }

  // eslint-disable-next-line require-yield
  async *findBatch(
    query: any,
    select?: string | undefined,
    options?: any,
    batchSize?: number | undefined
  ): AsyncGenerator<any, any, unknown> {
    return this._memberRepository.findBatch(query, select, options, batchSize);
  }

  insertMany(data: any, ordered: boolean): Promise<{ acknowledged: boolean; insertedCount: number; insertedIds: any }> {
    return this._memberRepository.insertMany(data, ordered);
  }

  updateOne(query: any, body: any): Promise<{ matched: number; modified: number }> {
    return this._memberRepository.updateOne(query, body);
  }

  upsertMany(data: any): Promise<any> {
    return this._memberRepository.upsertMany(data);
  }

  bulkWrite(bulkOperations: any, ordered: boolean): Promise<any> {
    return this._memberRepository.bulkWrite(bulkOperations, ordered);
  }
}
