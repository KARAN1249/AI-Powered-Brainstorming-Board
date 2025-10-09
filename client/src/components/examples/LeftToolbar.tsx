import { LeftToolbar } from "../LeftToolbar";

export default function LeftToolbarExample() {
  return (
    <div className="h-screen">
      <LeftToolbar
        onAddCard={() => console.log("Add card")}
        onClusterIdeas={() => console.log("Cluster ideas")}
        onSummarize={() => console.log("Summarize")}
      />
    </div>
  );
}
