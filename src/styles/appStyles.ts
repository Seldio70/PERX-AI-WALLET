import { StyleSheet } from "react-native";
import { colors, radius } from "../theme";

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  appChrome: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between"
  },
  brand: { color: colors.text, fontSize: 19, fontWeight: "900" },
  headerSub: { color: colors.muted, fontSize: 12, marginTop: 2, textTransform: "capitalize" },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  statusPill: {
    height: 34, paddingHorizontal: 12, borderRadius: radius.capsule,
    backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.stroke,
    flexDirection: "row", alignItems: "center", gap: 6
  },
  statusDot: { color: colors.accent, fontSize: 11 },
  statusText: { color: colors.soft, fontSize: 12, fontWeight: "700" },
  iconButton: {
    width: 42, height: 34, borderRadius: radius.capsule,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.stroke
  },
  logoutText: { color: colors.soft, fontSize: 12, fontWeight: "800" },
  screenContent: { paddingHorizontal: 20, paddingBottom: 36, gap: 16 },
  employeeContent: { paddingBottom: 112 },
  roleShell: { flex: 1 },
  heroPanel: { padding: 22, minHeight: 260, justifyContent: "space-between" },
  heroIcon: {
    width: 46, height: 46, borderRadius: radius.capsule, borderWidth: 1,
    borderColor: colors.stroke, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.panelStrong
  },
  heroTitle: { color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: "900", marginTop: 18 },
  heroText: { color: colors.soft, fontSize: 14, lineHeight: 21, marginTop: 12 },
  heroMetrics: { flexDirection: "row", gap: 10, marginTop: 18 },
  roleCard: { padding: 16, minHeight: 92, flexDirection: "row", alignItems: "center", gap: 14 },
  roleIcon: {
    width: 48, height: 48, borderRadius: radius.capsule, borderWidth: 1,
    borderColor: colors.stroke, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.panelStrong
  },
  roleTextWrap: { flex: 1 },
  roleTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  roleSub: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  greeting: { marginTop: 2 },
  greetingText: { color: colors.text, fontSize: 28, fontWeight: "900" },
  greetingSub: { color: colors.muted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  metricRow: { flexDirection: "row", gap: 8 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  sectionMeta: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  bodyText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  input: {
    minHeight: 48, borderRadius: 22, borderWidth: 1, borderColor: colors.stroke,
    paddingHorizontal: 15, paddingVertical: 12, color: colors.text,
    backgroundColor: "rgba(255,255,255,0.06)", fontSize: 15
  },
  categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    minHeight: 38, borderRadius: radius.capsule, borderWidth: 1, borderColor: colors.stroke,
    paddingHorizontal: 13, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  categoryChipActive: { borderColor: "rgba(247,248,250,0.42)", backgroundColor: "rgba(255,255,255,0.12)" },
  categoryChipText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  categoryChipTextActive: { color: colors.text },
  confidence: { color: colors.text, fontSize: 15, fontWeight: "900" },
  listRow: {
    minHeight: 66, borderRadius: 22, borderWidth: 1, borderColor: colors.stroke,
    backgroundColor: "rgba(255,255,255,0.06)", padding: 12,
    flexDirection: "row", alignItems: "center", gap: 12
  },
  smallIcon: {
    width: 38, height: 38, borderRadius: radius.capsule,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.panelStrong, borderWidth: 1, borderColor: colors.stroke
  },
  listText: { flex: 1 },
  listTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  listSub: { color: colors.muted, fontSize: 12, marginTop: 3 },
  listAmount: { color: colors.soft, fontSize: 14, fontWeight: "900" },
  qrPanel: { padding: 16, flexDirection: "row", alignItems: "center", gap: 16 },
  qrBox: { width: 176, height: 176, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.text },
  qrText: { flex: 1, gap: 8 },
  nfcPanel: { padding: 16, flexDirection: "row", alignItems: "center", gap: 16 },
  nfcCopy: { flex: 1, gap: 5 },
  allocationSummary: { padding: 22 },
  largeNumber: { color: colors.text, fontSize: 46, fontWeight: "900", marginTop: 10 },
  offerCard: { padding: 16, gap: 12 },
  offerImage: { width: "100%", height: 132, borderRadius: 20, backgroundColor: colors.panelStrong },
  providerCard: { width: 156, minHeight: 154, padding: 14, marginRight: 10, gap: 8 },
  providerLogo: { width: 52, height: 52, borderRadius: radius.capsule, backgroundColor: colors.panelStrong },
  selectedOfferCard: { borderColor: "rgba(247,248,250,0.42)", backgroundColor: "rgba(255,255,255,0.11)" },
  pointsCard: { width: 244, minHeight: 168, padding: 18, marginRight: 12, gap: 8 },
  pointsAccent: { width: 38, height: 6, borderRadius: radius.capsule, marginBottom: 8 },
  pointsValue: { color: colors.text, fontSize: 38, fontWeight: "900" },
  successPanel: { padding: 24, gap: 16, alignItems: "center" as const },
  successIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent,
    alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 4
  },
  packagePanel: { padding: 16, gap: 16 },
  packageSummaryPanel: { padding: 16, gap: 12 },
  packageSummaryHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  packageSummaryTotals: {
    minHeight: 48, borderTopWidth: 1, borderTopColor: colors.stroke, paddingTop: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between"
  },
  packageFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  selectedBadge: {
    minHeight: 34, borderRadius: radius.capsule, paddingHorizontal: 12,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
    borderColor: colors.stroke, backgroundColor: "rgba(255,255,255,0.08)"
  },
  selectedBadgeText: { color: colors.soft, fontSize: 12, fontWeight: "800" },
  offerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  approvalCard: { padding: 16, gap: 14 },
  employeeBudgetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  analyticsGrid: { padding: 12 },
  analyticsRow: {
    minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)"
  },
  analyticsLabel: { flexDirection: "row", alignItems: "center", gap: 10 },
  businessProfile: { padding: 22, gap: 12 },
  businessLogoImage: { width: 66, height: 66, borderRadius: radius.capsule, backgroundColor: colors.text },
  formPanel: { padding: 16, gap: 10 },
  formActions: { flexDirection: "row", gap: 10 },
  errorText: { color: colors.warning, fontSize: 13, fontWeight: "700" },
  segmented: {
    height: 48, borderRadius: radius.capsule, borderWidth: 1, borderColor: colors.stroke,
    backgroundColor: "rgba(255,255,255,0.06)", padding: 4, flexDirection: "row"
  },
  segment: { flex: 1, borderRadius: radius.capsule, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.text },
  segmentText: { color: colors.muted, fontWeight: "800" },
  segmentTextActive: { color: colors.background }
});
