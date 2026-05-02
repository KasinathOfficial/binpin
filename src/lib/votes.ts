export const getUpvotedBins = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('upvoted_bins') || '[]');
  } catch {
    return [];
  }
};

export const addUpvotedBin = (id: string) => {
  const bins = getUpvotedBins();
  if (!bins.includes(id)) {
    localStorage.setItem('upvoted_bins', JSON.stringify([...bins, id]));
  }
};

export const hasUpvotedBin = (id: string): boolean => {
  return getUpvotedBins().includes(id);
};

export const getUpvotedRequests = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('upvoted_requests') || '[]');
  } catch {
    return [];
  }
};

export const addUpvotedRequest = (id: string) => {
  const reqs = getUpvotedRequests();
  if (!reqs.includes(id)) {
    localStorage.setItem('upvoted_requests', JSON.stringify([...reqs, id]));
  }
};

export const hasUpvotedRequest = (id: string): boolean => {
  return getUpvotedRequests().includes(id);
};
