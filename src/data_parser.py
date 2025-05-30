import pandas as pd

def parse_data(file_path):
    df = pd.read_csv(file_path)
    return df


if __name__ == "__main__":

    df = parse_data("data\Custom-sales-report_010117-053025_all.csv")
    print(df.head())

