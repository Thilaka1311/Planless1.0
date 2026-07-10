import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Pencil, Plus, UserPlus } from 'lucide-react';
import { UserAvatar } from '../../../shared/components/UserAvatar';

interface CirclePermissionsProps {
  show: boolean;
  onClose: () => void;
  freshCircle: any;
  dbCircle: any;
  isAdmin: boolean;
  isHost: boolean;
  activeUserUuid: string | null;
  activeUserId: string;
  updateCircle: any;
  updateCircleMemberPreference: any;
  setCircles: any;
  setSelectedCircle: any;
  triggerToast: (msg: string) => void;
  members: any[];
}

export const CirclePermissions: React.FC<CirclePermissionsProps> = ({
  show,
  onClose,
  freshCircle,
  dbCircle,
  isAdmin,
  isHost,
  activeUserUuid,
  activeUserId,
  updateCircle,
  updateCircleMemberPreference,
  setCircles,
  setSelectedCircle,
  triggerToast,
  members,
}) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.25 }}
      className="fixed inset-0 z-[150] flex flex-col bg-[#0b0c10] text-zinc-100 animate-none"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3.5 border-b border-white/[0.04] bg-[#0b0c10] sticky top-0 z-20">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-sans font-black text-[15px] uppercase tracking-wider text-zinc-100 leading-none">
            Circle Permissions
          </h2>
          <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wide mt-1">
            {freshCircle.name}
          </p>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 font-sans">
        
        {/* SECTION: Member Permissions */}
        <div className="space-y-5">
          <h3 className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest">
            Member Permissions
          </h3>

          {/* Settings visible ONLY to the creator admin(s) */}
          {isHost && (
            <>
              {/* Toggle 1: Edit Circle Details (maps to allow_member_edit) */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                    <Pencil className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-bold text-zinc-200">Edit Circle Details</h4>
                    <p className="text-[10.5px] text-zinc-550 mt-0.5 leading-normal max-w-[220px]">
                      Allows members to update the circle name, description, cover photo, and preferences.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const newVal = !freshCircle.allow_member_edit;
                    try {
                      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                      await updateCircle({
                        circleId: targetCircleUuid,
                        name: freshCircle.name,
                        description: freshCircle.description || '',
                        coverImage: freshCircle.groupPhoto || freshCircle.groupImage,
                        planCreationPermission: freshCircle.plan_creation_permission,
                        addMembersPermission: freshCircle.add_members_permission,
                        editInfoPermission: freshCircle.edit_info_permission,
                        removeMembersPermission: freshCircle.remove_members_permission,
                        manageRolesPermission: freshCircle.manage_roles_permission,
                        allowAutoJoin: freshCircle.allow_auto_join,
                        allowMemberEdit: newVal,
                        allowMemberHost: freshCircle.allow_member_host,
                        allowMemberInvite: freshCircle.allow_member_invite
                      });
                      const updated = { ...freshCircle, allow_member_edit: newVal };
                      setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
                      setSelectedCircle?.(updated);
                      triggerToast(`Members can edit details: ${newVal ? "ON" : "OFF"}`);
                    } catch (err: any) {
                      triggerToast(`Failed: ${err.message || err}`);
                    }
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                    !!freshCircle.allow_member_edit ? "bg-[#25D366]" : "bg-zinc-800"
                  } cursor-pointer`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                    !!freshCircle.allow_member_edit ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Toggle 2: Allow members to host plans (maps to allow_member_host) */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                    <Plus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-bold text-zinc-200">Allow members to host plans</h4>
                    <p className="text-[10.5px] text-zinc-550 mt-0.5 leading-normal max-w-[220px]">
                      Allows members to create and spawn plans inside this circle.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const newVal = !freshCircle.allow_member_host;
                    try {
                      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                      await updateCircle({
                        circleId: targetCircleUuid,
                        name: freshCircle.name,
                        description: freshCircle.description || '',
                        coverImage: freshCircle.groupPhoto || freshCircle.groupImage,
                        planCreationPermission: freshCircle.plan_creation_permission,
                        addMembersPermission: freshCircle.add_members_permission,
                        editInfoPermission: freshCircle.edit_info_permission,
                        removeMembersPermission: freshCircle.remove_members_permission,
                        manageRolesPermission: freshCircle.manage_roles_permission,
                        allowAutoJoin: freshCircle.allow_auto_join,
                        allowMemberEdit: freshCircle.allow_member_edit,
                        allowMemberHost: newVal,
                        allowMemberInvite: freshCircle.allow_member_invite
                      });
                      const updated = { ...freshCircle, allow_member_host: newVal };
                      setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
                      setSelectedCircle?.(updated);
                      triggerToast(`Members can host plans: ${newVal ? "ON" : "OFF"}`);
                    } catch (err: any) {
                      triggerToast(`Failed: ${err.message || err}`);
                    }
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                    !!freshCircle.allow_member_host ? "bg-[#25D366]" : "bg-zinc-800"
                  } cursor-pointer`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                    !!freshCircle.allow_member_host ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Toggle 3: Add members to the circle (maps to allow_member_invite) */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                    <UserPlus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-bold text-zinc-200">Add members to the circle</h4>
                    <p className="text-[10.5px] text-zinc-550 mt-0.5 leading-normal max-w-[220px]">
                      Allows members to invite new friends and remove them from this group.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const newVal = !freshCircle.allow_member_invite;
                    try {
                      const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                      await updateCircle({
                        circleId: targetCircleUuid,
                        name: freshCircle.name,
                        description: freshCircle.description || '',
                        coverImage: freshCircle.groupPhoto || freshCircle.groupImage,
                        planCreationPermission: freshCircle.plan_creation_permission,
                        addMembersPermission: freshCircle.add_members_permission,
                        editInfoPermission: freshCircle.edit_info_permission,
                        removeMembersPermission: freshCircle.remove_members_permission,
                        manageRolesPermission: freshCircle.manage_roles_permission,
                        allowAutoJoin: freshCircle.allow_auto_join,
                        allowMemberEdit: freshCircle.allow_member_edit,
                        allowMemberHost: freshCircle.allow_member_host,
                        allowMemberInvite: newVal
                      });
                      const updated = { 
                        ...freshCircle, 
                        allow_member_invite: newVal
                      };
                      setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
                      setSelectedCircle?.(updated);
                      triggerToast(`Members can add members: ${newVal ? "ON" : "OFF"}`);
                    } catch (err: any) {
                      triggerToast(`Failed: ${err.message || err}`);
                    }
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                    !!freshCircle.allow_member_invite ? "bg-[#25D366]" : "bg-zinc-800"
                  } cursor-pointer`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                    !!freshCircle.allow_member_invite ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </>
          )}

          {/* Toggle 4: Two-Level Auto Join System */}
          {isAdmin ? (
            /* Admin view: Allow Auto Join */
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-bold text-zinc-200">Allow Auto Join</h4>
                  <p className="text-[10.5px] text-zinc-550 mt-0.5 leading-normal max-w-[220px]">
                    Members can choose to be automatically added to new Circle plans instead of receiving invitations. This toggle enables or disables the feature for the entire Circle.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!isHost}
                onClick={async () => {
                  const newVal = !freshCircle.allow_auto_join;
                  try {
                    const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                    await updateCircle({
                      circleId: targetCircleUuid,
                      name: freshCircle.name,
                      description: freshCircle.description || '',
                      coverImage: freshCircle.groupPhoto || freshCircle.groupImage,
                      planCreationPermission: freshCircle.plan_creation_permission,
                      addMembersPermission: freshCircle.add_members_permission,
                      editInfoPermission: freshCircle.edit_info_permission,
                      removeMembersPermission: freshCircle.remove_members_permission,
                      manageRolesPermission: freshCircle.manage_roles_permission,
                      allowAutoJoin: newVal,
                      allowMemberEdit: freshCircle.allow_member_edit,
                      allowMemberHost: freshCircle.allow_member_host,
                      allowMemberInvite: freshCircle.allow_member_invite
                    });
                    const updated = { 
                      ...freshCircle, 
                      allow_auto_join: newVal
                    };
                    setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updated : c));
                    setSelectedCircle?.(updated);
                    triggerToast(`Auto join for circle: ${newVal ? "ENABLED" : "DISABLED"}`);
                  } catch (err: any) {
                    triggerToast(`Failed: ${err.message || err}`);
                  }
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                  !!freshCircle.allow_auto_join ? "bg-[#25D366]" : "bg-zinc-800"
                } ${!isHost ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                  !!freshCircle.allow_auto_join ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
          ) : (
            /* Member view: Auto Join Plans */
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex items-center justify-center w-5 h-5 text-zinc-400">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-bold text-zinc-200">Auto Join Plans</h4>
                    <p className="text-[10.5px] text-zinc-550 mt-0.5 leading-normal max-w-[220px]">
                      Automatically join new plans created in this Circle when the feature is enabled by an admin. This toggle only controls the current member's preference.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!freshCircle.allow_auto_join}
                  onClick={async () => {
                    const targetCircleUuid = freshCircle.dbUuid || dbCircle?.id || freshCircle.id;
                    const activeUserUuidVal = activeUserUuid || activeUserId;
                    const myMemberObj = freshCircle.membersList?.find((m: any) => m.userId === activeUserUuidVal);
                    const currentPreference = !!myMemberObj?.auto_join_enabled;
                    const newPreference = !currentPreference;
                    try {
                      await updateCircleMemberPreference(targetCircleUuid, activeUserUuidVal, newPreference);
                      // Update local circles list state so local UI re-renders immediately
                      const updatedMembersList = (freshCircle.membersList || []).map((m: any) => {
                        if (m.userId === activeUserUuidVal) {
                          return { ...m, auto_join_enabled: newPreference, autoJoinPlans: newPreference };
                        }
                        return m;
                      });
                      const updatedCircleObj = { ...freshCircle, membersList: updatedMembersList };
                      setCircles?.((prev: any[]) => prev.map(c => c.id === freshCircle.id ? updatedCircleObj : c));
                      setSelectedCircle?.(updatedCircleObj);
                      triggerToast(`Auto join preference: ${newPreference ? "ON" : "OFF"}`);
                    } catch (err: any) {
                      triggerToast(`Failed preference update: ${err.message || err}`);
                    }
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                    (freshCircle.membersList?.find((m: any) => m.userId === (activeUserUuid || activeUserId))?.auto_join_enabled && freshCircle.allow_auto_join) ? "bg-[#25D366]" : "bg-zinc-800"
                  } ${!freshCircle.allow_auto_join ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                    (freshCircle.membersList?.find((m: any) => m.userId === (activeUserUuid || activeUserId))?.auto_join_enabled && freshCircle.allow_auto_join) ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
              {!freshCircle.allow_auto_join && (
                <p className="text-[10px] text-amber-500 font-semibold pl-8">
                  Auto Join isn't available for this Circle. Ask an admin to enable it.
                </p>
              )}
            </div>
          )}

        </div>

        {/* SECTION: Group admins */}
        <div className="space-y-4 pt-4 border-t border-white/[0.04]">
          <h3 className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest">
            Group admins
          </h3>
          
          <div className="space-y-3.5">
            {members.filter(m => m.role === 'Admin').map((admin, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={admin.avatar}
                    alt={admin.name}
                    size="w-7 h-7"
                    className="border border-white/10"
                  />
                  <p className="text-[12.5px] font-sans font-bold text-zinc-300 leading-tight">
                    {admin.name}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-sans font-bold tracking-wider text-[#ff8b66] bg-[#ff8b66]/10 px-1.5 py-0.5 rounded uppercase">
                    ADMIN
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
