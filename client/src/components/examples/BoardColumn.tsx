import { BoardColumn } from "../BoardColumn";
import { IdeaCard } from "../IdeaCard";

export default function BoardColumnExample() {
  return (
    <div className="p-4">
      <BoardColumn title="Ideas" count={2}>
        <IdeaCard
          id="1"
          title="Add authentication"
          content="Implement user login and registration"
          onEdit={(id) => console.log("Edit", id)}
          onDelete={(id) => console.log("Delete", id)}
        />
        <IdeaCard
          id="2"
          title="Create dashboard"
          content="Build a user dashboard with analytics"
          onEdit={(id) => console.log("Edit", id)}
          onDelete={(id) => console.log("Delete", id)}
        />
      </BoardColumn>
    </div>
  );
}
