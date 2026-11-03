// Indian Standard Time (IST) is UTC + 5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDate(date = new Date()) {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + IST_OFFSET_MS);
}

function getTodayISTString() {
  const ist = getISTDate();
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTimeISTString() {
  const ist = getISTDate();
  const hours = String(ist.getHours()).padStart(2, '0');
  const minutes = String(ist.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getCurrentTimeWithSecondsISTString() {
  const ist = getISTDate();
  let hours = ist.getHours();
  const minutes = String(ist.getMinutes()).padStart(2, '0');
  const seconds = String(ist.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
}

function getDayOfWeekIST() {
  const ist = getISTDate();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[ist.getDay()];
}

function formatTimeTo12Hour(time24) {
  if (!time24) return '—';
  const [h, m] = time24.split(':');
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${String(hour).padStart(2, '0')}:${m} ${ampm}`;
}

module.exports = {
  getISTDate,
  getTodayISTString,
  getCurrentTimeISTString,
  getCurrentTimeWithSecondsISTString,
  getDayOfWeekIST,
  formatTimeTo12Hour
};

