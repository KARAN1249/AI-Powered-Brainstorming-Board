import { RightPanel } from "../RightPanel";

export default function RightPanelExample() {
  const mockSuggestions = [
    {
      id: "1",
      text: "Add real-time collaboration features",
      timestamp: "2 minutes ago",
    },
    {
      id: "2",
      text: "Implement export to PDF functionality",
      timestamp: "5 minutes ago",
    },
  ];

  const mockSummary = `**Key Themes:**
• Product Development
• User Experience
• Technical Infrastructure

**Top Ideas:**
1. Implement AI-powered features
2. Enhance user interface design
3. Build scalable backend

**Next Steps:**
- Prioritize authentication system
- Design database schema
- Create wireframes for dashboard`;

  return (
    <div className="h-screen">
      <RightPanel
        summary={mockSummary}
        suggestions={mockSuggestions}
        onAddSuggestion={(text) => console.log("Add:", text)}
      />
    </div>
  );
}
