import { IdeaCard } from "../IdeaCard";

export default function IdeaCardExample() {
  return (
    <div className="p-4 max-w-md">
      <IdeaCard
        id="1"
        title="Implement dark mode"
        content="Add a theme toggle to allow users to switch between light and dark mode for better accessibility."
        cluster={{
          id: 1,
          name: "UI/UX",
          color: "hsl(340, 75%, 60%)",
        }}
        onEdit={(id) => console.log("Edit", id)}
        onDelete={(id) => console.log("Delete", id)}
        onMove={(id, direction) => console.log("Move", id, direction)}
      />
    </div>
  );
}
