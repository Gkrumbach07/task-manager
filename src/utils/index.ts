export const parsePullRequestUrl = (url: string) => {
	try {
		if (!url) return "";
		const urlObj = new URL(url);
		if (urlObj.hostname === "github.com") {
			const parts = urlObj.pathname.split("/").filter(Boolean); // ["owner", "repo", "pull", "number"]
			if (
			  parts.length === 4 &&
			  parts[2] === "pull" &&
			  !isNaN(parseInt(parts[3]))
			) {
			  return `${parts[1]}#${parts[3]}`; // "repo#number"
			}
		  }
		} catch (e) {
		  // Fallback for invalid URLs or unexpected formats
		  console.error("Error parsing PR URL:", e);
	}
	// Fallback to the full URL if parsing fails or it's not a standard GitHub PR URL
	return url;
}
