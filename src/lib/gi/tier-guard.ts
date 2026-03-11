import { prisma } from "@/lib/prisma";

export type TierLevel = 1 | 2 | 3 | 4;

export interface TierCheck {
  tier: TierLevel;
  allowed: boolean;
  message: string;
}

/**
 * Check the GI autonomy tier for a given action type.
 * Tier 1: INFORM — only inform, don't execute
 * Tier 2: SUGGEST — suggest + wait for confirmation (default)
 * Tier 3: EXECUTE_NOTIFY — execute + notify user
 * Tier 4: AUTONOMOUS — execute silently
 */
export async function checkTier(actionType: string): Promise<TierCheck> {
  const assignment = await prisma.gITierAssignment.findUnique({
    where: { actionType },
  });

  const tier = (assignment?.tier || 2) as TierLevel;

  switch (tier) {
    case 1:
      return {
        tier,
        allowed: false,
        message: "I can only inform you about this — I'm not authorized to take action.",
      };
    case 2:
      return {
        tier,
        allowed: false, // Needs confirmation
        message: "I need your approval before executing this action.",
      };
    case 3:
      return {
        tier,
        allowed: true,
        message: "Executing and notifying you.",
      };
    case 4:
      return {
        tier,
        allowed: true,
        message: "", // Silent
      };
    default:
      return {
        tier: 2,
        allowed: false,
        message: "I need your approval before executing this action.",
      };
  }
}

/**
 * Create a pending GI autonomous action for Tier 2 approval flow.
 */
export async function createPendingAction(params: {
  actionType: string;
  tier: number;
  description: string;
  targetUserId?: string;
  targetEntity?: string;
  actionData: Record<string, unknown>;
  reasoning?: string;
}) {
  return prisma.gIAutonomousAction.create({
    data: {
      actionType: params.actionType,
      tier: params.tier,
      status: "PENDING",
      description: params.description,
      targetUserId: params.targetUserId,
      targetEntity: params.targetEntity,
      actionData: params.actionData,
      reasoning: params.reasoning,
    },
  });
}
