namespace PosWeb.Analytics.Models;

public class Dataset
{
    public List<DatasetColumn> Columns { get; set; } = new();
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
    public DatasetSummary? Summary { get; set; }
}
