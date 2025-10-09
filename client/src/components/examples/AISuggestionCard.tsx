import { AISuggestionCard } from "../AISuggestionCard";

export default function AISuggestionCardExample() {
  return (
    <div className="p-4 max-w-md">
      <AISuggestionCard
        id="1"
        suggestion="Consider adding keyboard shortcuts for power users to navigate between cards quickly."
        onAdd={(text) => console.log("Add suggestion:", text)}
      />
    </div>
  );
}
