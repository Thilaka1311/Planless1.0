export function isValidTitle(title: string): boolean {
  return title.trim().length > 0;
}

export function isValidLocation(location: string): boolean {
  return location.trim().length > 0;
}

export function isValidDateTime(date: string, time: string): boolean {
  if (!date || !time) return false;
  
  try {
    const combinedStr = `${date}T${time}:00`;
    const planDate = new Date(combinedStr);
    return !isNaN(planDate.getTime());
  } catch {
    return false;
  }
}
