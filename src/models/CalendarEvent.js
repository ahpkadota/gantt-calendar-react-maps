export default class CalendarEvent {
  constructor({id, title, description, type, website, startTime, endTime, location, endLocation, guests, address, endAddress}) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.type = type;
    this.website = website;
    this.startTime = startTime;
    this.endTime = endTime;
    this.location = location;
    this.endLocation = endLocation;
    this.guests = guests;
    this.address = address;
    this.endAddress = endAddress;
  }
  static fromRow(row, parseDateTime, index) {
    return new CalendarEvent({
      id: index + 1,
      title: row[0] || "Untitled Event",
      description: row[1] || "",
      type: row[2] || "Other",
      website: row[3] || "",
      startTime: parseDateTime(row[4]),
      endTime: parseDateTime(row[5]),
      location: row[10] || "",
      endLocation: row[11] || "",
      guests: row[8] || [],
      address: row[6] || "",
      endAddress: row[7] || "",
    });
  }
  isValid() {
    return this.startTime && this.endTime && this.startTime <= this.endTime;
  }
  getTimeRange() {
    const formatTime = (date) => `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
    return `${formatTime(this.startTime)} - ${formatTime(this.endTime)}`;
  }
}
