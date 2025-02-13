export function searchTutorials(query: string, tutorials: any[]) {
  if (!query) return tutorials;

  const lowerCaseQuery = query.toLowerCase();

  return tutorials.filter(tutorial => {
    // Search in title
    if (tutorial.title.toLowerCase().includes(lowerCaseQuery)) return true;

    // Search in description
    if (tutorial.description.toLowerCase().includes(lowerCaseQuery)) return true;

    // Search in tags
    if (tutorial.tags.some((tag: string) => tag.toLowerCase().includes(lowerCaseQuery))) return true;

    // Search in content blocks
    if (tutorial.blocks.some((block: any) => 
      block.content.toLowerCase().includes(lowerCaseQuery)
    )) return true;

    return false;
  });
} 