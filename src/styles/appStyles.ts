import { Platform, StyleSheet } from "react-native";
import { colors, liquidShadow, radius, shadow } from "../theme";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboard: {
    flex: 1
  },
  appChrome: {
    flex: 1,
    backgroundColor: "transparent"
  },
  headerBrand: {
    flex: 1,
    minWidth: 0,
    gap: 1
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brand: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900"
  },
  headerSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    textTransform: "capitalize"
  },
  headerUserName: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.2
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  statusPill: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.capsule,
    backgroundColor: colors.glass,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...liquidShadow
  },
  statusDot: {
    color: colors.accent,
    fontSize: 11
  },
  statusText: {
    color: colors.soft,
    fontSize: 12,
    fontWeight: "700"
  },
  iconButton: {
    width: 42,
    height: 34,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glass
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glassStrong
  },
  avatarButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  logoutText: {
    color: colors.soft,
    fontSize: 12,
    fontWeight: "800"
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 16
  },
  employeeContent: {
    paddingBottom: 112,
    gap: 24
  },
  roleShell: {
    flex: 1
  },
  heroPanel: {
    padding: 22,
    minHeight: 260,
    justifyContent: "space-between"
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.glassEdge,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glassStrong
  },
  heroTitle: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    marginTop: 18
  },
  heroText: {
    color: colors.soft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12
  },
  heroMetrics: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18
  },
  roleCard: {
    padding: 16,
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelStrong
  },
  roleTextWrap: {
    flex: 1
  },
  roleTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  roleSub: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3
  },
  greeting: {
    marginTop: 4,
    marginBottom: 2
  },
  greetingText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900"
  },
  greetingSub: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20
  },
  metricRow: {
    flexDirection: "row",
    gap: 8
  },
  section: {
    gap: 14
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  input: {
    minHeight: 48,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: "rgba(0,0,0,0.03)",
    fontSize: 15
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  categoryChip: {
    minHeight: 38,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  categoryChipActive: {
    borderColor: "rgba(247,248,250,0.42)",
    backgroundColor: "rgba(255,255,255,0.12)"
  },
  categoryChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  categoryChipTextActive: {
    color: colors.text
  },
  confidence: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  listRow: {
    minHeight: 72,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    backgroundColor: colors.panel,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  smallIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelStrong,
    borderWidth: 1,
    borderColor: colors.stroke
  },
  listText: {
    flex: 1
  },
  listTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  listSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3
  },
  listAmount: {
    color: colors.soft,
    fontSize: 14,
    fontWeight: "900"
  },
  qrPanel: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  qrBox: {
    width: 176,
    height: 176,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle
  },
  qrText: {
    flex: 1,
    gap: 8
  },
  nfcPanel: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  nfcCopy: {
    flex: 1,
    gap: 5
  },
  allocationSummary: {
    padding: 22
  },
  largeNumber: {
    color: colors.text,
    fontSize: 46,
    fontWeight: "900",
    marginTop: 10
  },
  offerCard: {
    padding: 16,
    gap: 12
  },
  offerImage: {
    width: "100%",
    height: 132,
    borderRadius: 20,
    backgroundColor: colors.panelStrong
  },
  providerCard: {
    width: 156,
    minHeight: 154,
    padding: 14,
    marginRight: 10,
    gap: 8
  },
  providerLogo: {
    width: 52,
    height: 52,
    borderRadius: radius.capsule,
    backgroundColor: colors.panelStrong
  },
  selectedOfferCard: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  pointsCard: {
    width: 244,
    minHeight: 168,
    padding: 18,
    marginRight: 12,
    gap: 8
  },
  pointsAccent: {
    width: 38,
    height: 6,
    borderRadius: radius.capsule,
    marginBottom: 8
  },
  pointsValue: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "900"
  },
  packagePanel: {
    padding: 16,
    gap: 16
  },
  packageSummaryPanel: {
    padding: 16,
    gap: 12
  },
  packageSummaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  packageSummaryTotals: {
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  packageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  selectedBadge: {
    minHeight: 34,
    borderRadius: radius.capsule,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  selectedBadgeText: {
    color: colors.soft,
    fontSize: 12,
    fontWeight: "800"
  },
  offerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  employeeBudgetCard: {
    padding: 14,
    gap: 12
  },
  approvalCard: {
    padding: 16,
    gap: 14
  },
  employeeBudgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  analyticsGrid: {
    padding: 12
  },
  analyticsRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)"
  },
  analyticsLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  businessProfile: {
    padding: 22,
    gap: 12
  },
  businessLogoImage: {
    width: 66,
    height: 66,
    borderRadius: radius.capsule,
    backgroundColor: colors.surfaceContainerHigh
  },
  formPanel: {
    padding: 16,
    gap: 10
  },
  formActions: {
    flexDirection: "row",
    gap: 10
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "700"
  },
  segmented: {
    height: 48,
    borderRadius: radius.capsule,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 4,
    flexDirection: "row"
  },
  segment: {
    flex: 1,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentActive: {
    backgroundColor: colors.primary
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: colors.onPrimary
  },
  loginContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 18,
    paddingTop: 8
  },
  loginScreen: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 24,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center"
  },
  loginBrand: {
    alignItems: "center",
    gap: 16
  },
  loginLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center"
  },
  loginTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center"
  },
  loginSubtitle: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center"
  },
  loginCard: {
    gap: 16
  },
  loginFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.strokeSubtle,
    paddingBottom: 10,
    paddingTop: 6
  },
  loginFieldInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 8
  },
  loginFieldInputWeb: {
    outlineStyle: "solid",
    outlineWidth: 0,
    outlineColor: "transparent"
  },
  loginForgotLink: {
    alignSelf: "flex-end",
    paddingTop: 8,
    paddingRight: 8
  },
  loginRoleStack: {
    gap: 12,
    marginTop: 8
  },
  loginRoleButton: {
    minHeight: 48,
    borderRadius: radius.capsule,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center"
  },
  loginRoleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  loginRoleButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600"
  },
  loginRoleButtonTextActive: {
    color: colors.primary,
    fontWeight: "700"
  },
  loginFooterLink: {
    alignItems: "center",
    paddingVertical: 4
  },
  loginFooterText: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center"
  },
  loginFooterAction: {
    color: colors.primary,
    fontWeight: "700"
  },
  loginContinue: {
    marginTop: 8,
    minHeight: 56
  },
  catalogSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16
  },
  catalogSummaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,88,188,0.1)"
  },
  catalogProviderCard: {
    padding: 16,
    gap: 12,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glass
  },
  catalogProviderHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  catalogProviderLogo: {
    width: 48,
    height: 48,
    borderRadius: 14
  },
  catalogProviderLogoFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerHigh
  },
  catalogSelectBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radius.capsule,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glassStrong,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  catalogSelectBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  catalogSelectText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  },
  catalogSelectTextActive: {
    color: colors.onPrimary
  },
  catalogExpandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4
  },
  catalogExpandText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700"
  },
  catalogOfferRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8
  },
  catalogOfferThumb: {
    width: 52,
    height: 52,
    borderRadius: 12
  },
  catalogOfferCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glassStrong
  },
  catalogOfferCheckActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  inputWrap: {
    minHeight: 56,
    borderRadius: radius.capsule,
    backgroundColor: colors.glass,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4
  },
  inputField: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 12
  },
  rolePills: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4
  },
  rolePill: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.capsule,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center"
  },
  rolePillActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  rolePillText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  rolePillTextActive: {
    color: colors.primary
  },
  noticeText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "700"
  },
  forgotLink: {
    alignSelf: "center",
    paddingVertical: 4
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800"
  },
  authHint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 2
  },
  adminHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  adminHeaderCopy: {
    flex: 1
  },
  searchPill: {
    width: 44,
    height: 44,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center"
  },
  bentoRow: {
    flexDirection: "row",
    gap: 10
  },
  adminActionsRow: {
    flexDirection: "row",
    gap: 10
  },
  adminActionCard: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.primary,
    borderRadius: radius.cardLg,
    ...shadow
  },
  adminActionCardHalf: {
    flex: 1
  },
  adminActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  adminActionTitle: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "900"
  },
  adminActionSub: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    marginTop: 2
  },
  recordRow: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  recordAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.capsule,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center"
  },
  recordAvatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900"
  },
  statusBadge: {
    borderRadius: radius.capsule,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(111,251,133,0.25)",
    borderWidth: 0.5,
    borderColor: "rgba(111,251,133,0.4)"
  },
  statusBadgeText: {
    color: colors.onSecondaryContainer,
    fontSize: 11,
    fontWeight: "800"
  },
  activityPanel: {
    padding: 18,
    gap: 16
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  activityBody: {
    minHeight: 140,
    borderRadius: radius.compact,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  activityValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  insightsTagline: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 380,
    marginTop: 6
  },
  activityStage: {
    minHeight: 132,
    borderRadius: radius.compact,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glassStrong,
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  activityStageLabel: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  activityPulseRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  activityPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary
  },
  exportPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.capsule,
    backgroundColor: colors.primary
  },
  exportPillText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "800"
  },
  txList: {
    padding: 0,
    overflow: "hidden"
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.35)"
  },
  txRowLast: {
    borderBottomWidth: 0
  },
  txAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  txBody: {
    flex: 1
  },
  txTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  txMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  txAmounts: {
    alignItems: "flex-end"
  },
  txAmount: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "900"
  },
  txStatus: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2
  },
  txEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  manageDivider: {
    marginTop: 8,
    marginBottom: 4,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)"
  },
  businessContent: {
    paddingBottom: 132
  },
  businessNav: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  businessNavPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radius.capsule,
    borderWidth: 0.5,
    borderColor: colors.stroke,
    ...shadow
  },
  businessNavItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.capsule,
    overflow: "hidden"
  },
  businessNavItemActiveLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.capsule,
    backgroundColor: colors.primary
  },
  businessNavLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  businessNavLabelActive: {
    color: colors.onPrimary
  },
  businessNavFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginLeft: 4
  },
  navItemPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }]
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  categoryTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.strokeSubtle,
    backgroundColor: "rgba(255,255,255,0.55)",
    position: "relative"
  },
  categoryTileActive: {
    borderWidth: 1.5
  },
  categoryTileText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  categoryTileCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    maxHeight: "92%",
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 24,
    ...liquidShadow
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginBottom: 12
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)"
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  modalSub: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    backgroundColor: colors.surfaceContainer
  },
  modalContent: {
    gap: 14,
    paddingTop: 18,
    paddingBottom: 20
  },
  offerModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  modalFieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 6
  },
  modalRow: {
    flexDirection: "row",
    gap: 10
  },
  imagePicker: {
    height: 220,
    borderRadius: radius.cardLg,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: colors.glassMist
  },
  imagePickerPreview: {
    width: "100%",
    height: "100%"
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  imagePickerLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  imagePickerHint: {
    color: colors.muted,
    fontSize: 12
  },
  imagePickerOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(15,23,42,0.7)"
  },
  imagePickerOverlayText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "800"
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(186,26,26,0.08)",
    marginTop: 10
  },
  dangerButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "800"
  },
  detailHeroImage: {
    width: "100%",
    height: 220,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surfaceContainerHigh
  },
  detailMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4
  },
  detailCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.capsule
  },
  detailCategoryText: {
    fontSize: 12,
    fontWeight: "800"
  },
  detailMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,0,0,0.04)"
  },
  detailMetaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  detailStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4
  },
  detailStatCard: {
    flex: 1,
    padding: 14,
    gap: 4
  },
  detailStatLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  detailStatValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  detailBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21
  },
  detailKeyValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)"
  },
  detailKeyLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600"
  },
  detailKeyValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    maxWidth: "60%",
    textAlign: "right"
  },
  detailKeyValueMono: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })
  },
  txDetailHero: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8
  },
  txDetailIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  txDetailAmount: {
    color: colors.secondary,
    fontSize: 30,
    fontWeight: "900"
  },
  txDetailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(111,251,133,0.18)"
  },
  txDetailBadgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "800"
  },
  txDetailCard: {
    padding: 16,
    gap: 0
  },
  profileHeroCard: {
    padding: 22,
    gap: 14,
    alignItems: "center",
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glass
  },
  profileHeroLogo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceContainerHigh
  },
  profileHeroLogoWrap: {
    position: "relative"
  },
  profileHeroLogoEdit: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface
  },
  profileHeroName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center"
  },
  profileHeroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center"
  },
  profileVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,110,40,0.12)"
  },
  profileVerifiedText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "800"
  },
  profileHeroDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  profileSection: {
    padding: 18,
    gap: 12,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glass
  },
  profileSectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10
  },
  profileRowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)"
  },
  profileRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,88,188,0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  profileRowBody: {
    flex: 1
  },
  profileRowLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  profileRowValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2
  },
  offerListCard: {
    padding: 14,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glass
  },
  offerListThumb: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh
  },
  offerListBody: {
    flex: 1,
    gap: 4
  },
  offerListTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  offerListMeta: {
    color: colors.muted,
    fontSize: 12
  },
  offerListSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2
  },
  offerListPriceChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  offerListPriceText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  offersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  offersHeaderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.capsule,
    backgroundColor: colors.primary
  },
  offersHeaderActionText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "800"
  },
  accountTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: radius.cardLg,
    backgroundColor: colors.panel,
    borderWidth: 0.5,
    borderColor: colors.stroke
  },
  accountTileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,88,188,0.1)"
  },
  accountTileBody: {
    flex: 1
  },
  accountTileTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  accountTileSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  walletHero: {
    marginTop: 4,
    marginBottom: 8
  },
  walletCardList: {
    gap: 12
  },
  walletCardListItem: {
    marginBottom: 0
  },
  cardStack: {
    gap: 0
  },
  stackItem: {
    marginBottom: 16
  },
  stackItemCollapsed: {
    marginTop: -126
  },
  aiCard: {
    padding: 20,
    gap: 18
  },
  aiHead: {
    gap: 12
  },
  aiBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.capsule,
    backgroundColor: colors.primary
  },
  aiBadgeText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4
  },
  aiHeadTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  aiPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  aiThumb: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh
  },
  aiPrimaryInfo: {
    flex: 1,
    gap: 5
  },
  aiName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  aiProvider: {
    color: colors.muted,
    fontSize: 13
  },
  aiPrice: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2
  },
  aiTapHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2
  },
  aiReason: {
    color: colors.soft,
    fontSize: 13,
    lineHeight: 19
  },
  aiCtas: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2
  },
  nearbyScrollRow: {
    gap: 14,
    paddingVertical: 4,
    paddingRight: 4
  },
  nearbyCard: {
    width: 184,
    minHeight: 188,
    padding: 16,
    gap: 10
  },
  nearbyThumb: {
    width: "100%",
    height: 98,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh
  },
  nearbyName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  nearbyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  nearbyMeta: {
    flex: 1,
    color: colors.muted,
    fontSize: 12
  },
  nearbyReason: {
    color: colors.soft,
    fontSize: 12,
    lineHeight: 16
  },
  apCard: {
    padding: 16,
    gap: 14
  },
  apHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  apIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  apHeadBody: {
    flex: 1
  },
  apConfidence: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.compact,
    backgroundColor: "rgba(0,88,188,0.1)"
  },
  apConfidenceValue: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "900"
  },
  apConfidenceLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  },
  apDetail: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 14
  },
  apItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  apItemIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerHigh
  },
  apItemIndexText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  apItemBody: {
    flex: 1
  },
  apItemName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  apItemMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  apSwap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  apSwapText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  apReasonBox: {
    padding: 14,
    borderRadius: radius.compact,
    backgroundColor: "rgba(0,88,188,0.06)",
    gap: 6
  },
  apReasonLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  apReasonText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  apTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  apPlanner: {
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,110,40,0.12)"
  },
  apPlannerHead: {
    gap: 6
  },
  apPlannerBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.capsule,
    backgroundColor: colors.secondary
  },
  apPlannerBadgeText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3
  },
  apPlannerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2
  },
  apPlannerSub: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  apBudgetBar: {
    gap: 6
  },
  apBudgetTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: "hidden"
  },
  apBudgetFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.secondary
  },
  apBudgetLabels: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  apBudgetUsed: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "800"
  },
  apBudgetAvail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  apToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: radius.compact,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: "transparent"
  },
  apToggleRowOn: {
    borderColor: "rgba(0,110,40,0.2)",
    backgroundColor: "rgba(0,110,40,0.06)"
  },
  apToggleIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  apToggleIndexText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  apToggleThumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh
  },
  apToggleBody: {
    flex: 1,
    gap: 2
  },
  apToggleName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  apToggleMeta: {
    color: colors.muted,
    fontSize: 11
  },
  apPlannerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4
  },
  apShuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,110,40,0.08)"
  },
  apShuffleText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "800"
  },
  packageModalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.compact,
    backgroundColor: colors.surfaceContainerHigh,
    marginBottom: 12
  },
  packageModalThumb: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.surface
  },
  packageModalBody: {
    flex: 1,
    gap: 2
  },
  packageModalName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  packageModalMeta: {
    color: colors.muted,
    fontSize: 12
  },
  packageModalRemove: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  offersShopHero: {
    height: 430,
    marginHorizontal: -20,
    marginTop: -6,
    marginBottom: 18,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerHigh
  },
  offersShopHeroRail: {
    ...StyleSheet.absoluteFillObject
  },
  offersShopHeroSlide: {
    height: "100%",
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerHigh
  },
  offersShopHeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  },
  offersShopHeroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,7,16,0.08)",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  offersShopTopBar: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  offersShopTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  offersShopAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  offersShopAvatarLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceContainerHigh
  },
  offersShopAvatarText: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900"
  },
  offersShopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  offersHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12,14,22,0.42)"
  },
  offersHeroIconActive: {
    backgroundColor: colors.primary
  },
  offersShopHeroContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 34
  },
  offersShopKicker: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.28)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8
  },
  offersShopHeadline: {
    color: colors.onPrimary,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12
  },
  offersShopCta: {
    marginTop: 22,
    minHeight: 46,
    paddingHorizontal: 28,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)"
  },
  offersShopCtaText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "900"
  },
  offersShopDots: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    marginTop: 20
  },
  offersShopDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.42)"
  },
  offersShopDotActive: {
    width: 22,
    backgroundColor: colors.onPrimary
  },
  featuredStoreRow: {
    gap: 14,
    paddingRight: 10,
    paddingVertical: 2
  },
  featuredStoreCard: {
    width: 132,
    minHeight: 156,
    borderRadius: 24,
    backgroundColor: colors.glass,
    padding: 14,
    justifyContent: "flex-end",
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    ...liquidShadow
  },
  featuredStoreLogoWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glassStrong,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    marginBottom: 16
  },
  featuredStoreLogo: {
    width: 52,
    height: 52,
    borderRadius: 26
  },
  featuredStoreInitial: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  featuredStoreName: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900"
  },
  featuredStoreMeta: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5
  },
  offersBrowseHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4
  },
  offersSectionTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  },
  offersBrowseMeta: {
    color: colors.soft,
    fontSize: 12,
    fontWeight: "800"
  },
  marketGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 8
  },
  marketCard: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "46%",
    maxWidth: "48%",
    borderRadius: radius.compact,
    backgroundColor: colors.glass,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    overflow: "hidden",
    ...liquidShadow
  },
  marketCardImg: {
    width: "100%",
    height: 118,
    backgroundColor: colors.surfaceContainerHigh
  },
  marketCardBody: {
    padding: 12,
    gap: 6
  },
  marketCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  marketCatDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  marketCardCat: {
    flex: 1,
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3
  },
  marketSaveBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glassStrong
  },
  marketCardTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
    minHeight: 34
  },
  marketCardProvider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  marketCardLogo: {
    width: 16,
    height: 16,
    borderRadius: 5
  },
  marketCardProviderName: {
    flex: 1,
    color: colors.soft,
    fontSize: 11,
    fontWeight: "600"
  },
  marketCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2
  },
  marketCardPrice: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  marketDiscountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  marketDiscountText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800"
  },
  tapPanel: {
    padding: 18,
    gap: 12
  },
  tapHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  tapDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.muted
  },
  tapDotActive: {
    backgroundColor: colors.secondary
  },
  filterRow: {
    gap: 10,
    paddingVertical: 6,
    paddingRight: 8
  },
  filterChip: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    backgroundColor: colors.panelStrong
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  filterChipTextActive: {
    color: colors.onPrimary
  },
  filterSavedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  offerV2: {
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.stroke,
    overflow: "hidden",
    ...shadow
  },
  offerV2Hero: {
    height: 168,
    justifyContent: "flex-end",
    padding: 14
  },
  offerV2Img: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    backgroundColor: colors.surfaceContainerHigh
  },
  offerV2Grad: {
    ...StyleSheet.absoluteFillObject
  },
  offerV2Cat: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.capsule
  },
  offerV2CatText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3
  },
  offerV2Discount: {
    position: "absolute",
    top: 12,
    left: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(12,14,22,0.5)"
  },
  offerV2DiscountText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: "800"
  },
  offerV2Save: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 0.5,
    borderColor: colors.stroke
  },
  offerV2SaveActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  offerV2HeroTitle: {
    color: colors.onPrimaryContainer,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  offerV2Body: {
    padding: 16,
    gap: 10
  },
  offerV2ProviderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  offerV2Logo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceContainerHigh
  },
  offerV2LogoFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,88,188,0.1)"
  },
  offerV2Provider: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  offerV2LocPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  offerV2Loc: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  offerV2Desc: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  offerV2Footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  offerV2PriceChip: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  offerV2Price: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  offerV2PriceLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700"
  },
  offerV2Ends: {
    color: colors.soft,
    fontSize: 12,
    fontWeight: "600"
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.capsule,
    backgroundColor: colors.primary
  },
  inviteButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "800"
  },
  employeeRow: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glass
  },
  inviteSuccess: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8
  },
  inviteSuccessIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  pointsHero: {
    padding: 20,
    gap: 10
  },
  pointsHeroValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  },
  pointsHeroSub: {
    color: colors.muted,
    fontSize: 13
  },
  pointsFeedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10
  },
  pointsFeedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelStrong
  },
  challengeCard: {
    padding: 16,
    gap: 10
  },
  challengeMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  challengeEmployeeList: {
    gap: 10,
    marginTop: 4
  },
  challengeEmployeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,88,188,0.08)"
  },
  challengeLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4
  },
  challengeSourceBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,88,188,0.1)",
    marginBottom: 6
  },
  challengeSourceBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  challengeMilestoneBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  challengeMilestoneText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700"
  },
  challengePoints: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  pointChallengeCard: {
    padding: 14,
    gap: 12
  },
  pointChallengeHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  pointChallengeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelStrong
  },
  pointChallengeCopy: {
    flex: 1,
    gap: 2
  },
  pointChallengeProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: "hidden"
  },
  pointChallengeProgressFill: {
    height: "100%",
    borderRadius: 4
  },
  pointChallengeProgressMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  pointChallengeProgressLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  pointChallengePct: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  },
  pointChallengeComplete: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "800"
  },
  packageCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.capsule,
    backgroundColor: colors.glass,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    ...liquidShadow
  },
  packageCapsuleThumbs: {
    flexDirection: "row",
    alignItems: "center"
  },
  packageCapsuleThumb: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surfaceContainerHigh
  },
  packageCapsuleCopy: {
    flex: 1,
    gap: 3
  },
  packageCapsuleTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  packageCapsuleMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600"
  },
  packageCapsuleMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  packageCapsuleArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glassStrong
  },
  challengeCapsuleRow: {
    gap: 12,
    paddingVertical: 6
  },
  challengeCapsule: {
    width: 100,
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radius.compact,
    backgroundColor: colors.glass,
    borderWidth: 0.8,
    borderColor: colors.glassEdge
  },
  challengeCapsuleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer
  },
  challengeCapsuleTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 14
  },
  challengeCapsuleMeta: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  },
  challengeRingWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center"
  },
  challengeRingCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  automationRow: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  automationToggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    backgroundColor: colors.stroke
  },
  automationToggleOn: {
    backgroundColor: colors.primary
  },
  automationKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.onPrimary
  },
  automationKnobOn: {
    alignSelf: "flex-end"
  },
  automationPointsInput: {
    width: 64,
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.compact,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.panel,
    color: colors.text,
    fontWeight: "800"
  },
  employeeMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4
  },
  employeeMetaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.capsule,
    backgroundColor: colors.panelStrong,
    borderWidth: 1,
    borderColor: colors.stroke
  },
  employeeMetaPillText: {
    color: colors.soft,
    fontSize: 11,
    fontWeight: "700"
  },
  inviteCodeBox: {
    padding: 12,
    borderRadius: radius.compact,
    backgroundColor: colors.panelStrong,
    borderWidth: 1,
    borderColor: colors.stroke,
    alignItems: "center",
    gap: 4
  },
  inviteCodeText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1
  },
  compactPointsCard: {
    padding: 14,
    gap: 6
  },
  redeemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  logoutWrap: {
    position: "relative"
  },
  logoutButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.capsule,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    backgroundColor: colors.panel
  },
  accountHero: {
    alignItems: "center",
    marginBottom: 20
  },
  accountAvatarRing: {
    borderRadius: radius.capsule,
    padding: 4,
    backgroundColor: colors.primary
  },
  accountAvatar: {
    width: 96,
    height: 96,
    borderRadius: radius.capsule,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.surface
  },
  accountHeroName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 14
  },
  accountHeroMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  accountHeroSub: {
    color: colors.soft,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center"
  },
  accountSettingsList: {
    gap: 12,
    marginBottom: 20
  },
  accountSettingsRow: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  accountSettingsIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center"
  },
  accountSettingsCopy: {
    flex: 1
  },
  accountSettingsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600"
  },
  accountSettingsSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16
  },
  accountFieldPanel: {
    padding: 18,
    gap: 4
  },
  accountFieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  accountFieldValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  accountFieldGap: {
    marginTop: 10
  },
  accountSubpage: {
    gap: 18
  },
  accountBackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start"
  },
  accountBackText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700"
  },
  accountSubpageTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  accountSubpageSub: {
    color: colors.muted,
    fontSize: 13,
    marginTop: -6
  },
  accountInput: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.compact,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.panel,
    color: colors.text,
    fontSize: 14
  },
  accountToggleRow: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  accountToggleList: {
    gap: 12
  },
  accountCycleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  accountCycleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.panel
  },
  accountCycleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  accountCycleChipText: {
    color: colors.soft,
    fontSize: 12,
    fontWeight: "700"
  },
  accountCycleChipTextActive: {
    color: colors.onPrimary
  },
  activityPageHeader: {
    gap: 4,
    marginBottom: 4
  },
  redemptionPagerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8
  },
  redemptionPagerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  automationNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4
  },
  employerQuickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  employerQuickCard: {
    flex: 1,
    minWidth: 140,
    padding: 14,
    gap: 6
  },
  employerAlertCard: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  employerAlertIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 152, 0, 0.14)"
  },
  employerStatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  employerStatCapsule: {
    width: "31%",
    flexGrow: 1,
    flexBasis: "30%",
    alignItems: "center",
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.compact,
    backgroundColor: colors.glass,
    borderWidth: 0.8,
    borderColor: colors.glassEdge
  },
  employerStatPressable: {
    alignItems: "center",
    gap: 3,
    width: "100%"
  },
  employerStatValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  employerStatLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center"
  },
  employerActionRow: {
    gap: 8,
    paddingVertical: 2
  },
  employerActionCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.capsule,
    backgroundColor: colors.glass,
    borderWidth: 0.8,
    borderColor: colors.glassEdge
  },
  employerActionCapsuleText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  employerActivityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.strokeSubtle
  },
  employerActivityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary
  },
  employerActivityTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  employerActivitySub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1
  },
  employerActivityMeta: {
    alignItems: "flex-end",
    gap: 2
  },
  employerActivityAmount: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  employerActivityStatus: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  },
  compactPanel: {
    padding: 14,
    gap: 10
  },
  compactInputRow: {
    flexDirection: "row",
    gap: 10
  },
  automationRowCompact: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6
  },
  teamBalanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  teamBalanceChip: {
    minWidth: "30%",
    flexGrow: 1,
    flexBasis: "30%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.compact,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    gap: 2
  },
  teamBalanceName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  },
  teamBalancePoints: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  redemptionPreviewRow: {
    gap: 10,
    paddingVertical: 2
  },
  redemptionPreviewCard: {
    width: 148,
    padding: 12,
    gap: 4
  },
  redemptionPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  redemptionPreviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,88,188,0.12)"
  },
  redemptionPreviewAvatarText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  redemptionPreviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted
  },
  redemptionPreviewDotSettled: {
    backgroundColor: colors.secondary
  },
  redemptionPreviewName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4
  },
  redemptionPreviewPerk: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    minHeight: 30
  },
  redemptionPreviewAmount: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2
  },
  redemptionPreviewMeta: {
    color: colors.soft,
    fontSize: 10,
    fontWeight: "700"
  },

  // ── Perk Duel ─────────────────────────────────────────────────────────────
  duelBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.tertiary,
    borderRadius: radius.card,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 8
  },
  duelBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center"
  },
  duelBannerTitle: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: "700"
  },
  duelBannerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 1
  },
  duelShell: {
    flex: 1,
    backgroundColor: colors.background
  },
  // Intro
  duelIntro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32
  },
  duelCloseBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 24,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center"
  },
  duelIntroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    ...shadow
  },
  duelIntroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 10,
    letterSpacing: -0.5
  },
  duelIntroSub: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28
  },
  duelRoundPips: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 36
  },
  duelPip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceContainerHigh
  },
  duelStartBtn: {
    width: 200
  },
  duelNoPerks: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center"
  },
  // Round
  duelRoundWrap: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  duelTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4
  },
  duelProgress: {
    flexDirection: "row",
    gap: 6
  },
  duelProgressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerHigh
  },
  duelProgressDotActive: {
    backgroundColor: colors.tertiary
  },
  duelRoundLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted
  },
  duelPickPrompt: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: -0.3
  },
  duelCards: {
    flexDirection: "row",
    gap: 10,
    flex: 1,
    maxHeight: 440
  },
  duelCard: {
    flex: 1,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: colors.panelStrong,
    ...shadow
  },
  duelCardImg: {
    width: "100%",
    height: 180
  },
  duelWinBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center"
  },
  duelCardBody: {
    padding: 12,
    flex: 1
  },
  duelCardBodyWin: {
    backgroundColor: "rgba(111,251,133,0.12)"
  },
  duelCardCat: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4
  },
  duelCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 18,
    marginBottom: 4
  },
  duelCardProvider: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 6
  },
  duelCardPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.tertiary
  },
  duelVsWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 30
  },
  duelVs: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.muted,
    letterSpacing: 1
  },
  duelHint: {
    textAlign: "center",
    color: colors.soft,
    fontSize: 12,
    marginTop: 16
  },
  // Results
  duelResults: {
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center"
  },
  duelResultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...shadow
  },
  duelResultProfile: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.4
  },
  duelResultSub: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 28
  },
  duelCatBars: {
    width: "100%",
    gap: 12,
    marginBottom: 28
  },
  duelCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  duelCatLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    width: 100
  },
  duelCatTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: "hidden"
  },
  duelCatFill: {
    height: "100%",
    borderRadius: 4
  },
  duelCatCount: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    width: 36,
    textAlign: "right"
  },
  duelPicksTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    alignSelf: "flex-start",
    marginBottom: 12
  },
  duelPickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    backgroundColor: colors.panelStrong,
    borderRadius: radius.card,
    padding: 12,
    marginBottom: 8,
    ...shadow
  },
  duelPickThumb: {
    width: 52,
    height: 52,
    borderRadius: 10
  },
  duelPickPts: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted
  },
  duelUseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 60
  },
  duelResultActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 24
  }
});
