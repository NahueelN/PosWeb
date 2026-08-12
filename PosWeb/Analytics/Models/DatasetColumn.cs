namespace PosWeb.Analytics.Models;

public class DatasetColumn
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "string"; // string, number, currency, date, percentage
    public string? Label { get; set; }
    public string? Format { get; set; } // currency, date-short, percentage
}
