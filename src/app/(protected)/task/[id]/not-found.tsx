export default function TaskNotFound() {
  return (
    <div className="container py-12 text-center">
      <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
      <p className="text-muted-foreground">
        The task you are looking for does not exist or has been deleted.
      </p>
    </div>
  );
}
