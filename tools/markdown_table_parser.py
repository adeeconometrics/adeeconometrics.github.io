import re
from typing import Dict, List, Tuple
from tabulate import tabulate


def parse_markdown_table(markdown_content: str) -> Tuple[List[str], List[Dict[str, str]]]:
    """
    Parse a markdown table and return headers and content as dictionaries.

    Args:
        markdown_content (str): The markdown table content as string

    Returns:
        Tuple[List[str], List[Dict[str, str]]]: Headers and list of row dictionaries
    """
    # Split content into lines and remove empty lines
    lines = [line.strip()
             for line in markdown_content.split('\n') if line.strip()]

    # Extract headers (first line)
    headers = [h.strip() for h in re.findall(
        r'\|(.*?)(?=\||$)', lines[0]) if h.strip()]

    # Skip the separator line (second line)
    data = []

    # Process each data row
    for line in lines[2:]:  # Skip header and separator lines
        if '|' not in line:  # Skip non-table lines
            continue

        # Extract cell values
        row_values = [cell.strip() for cell in re.findall(
            r'\|(.*?)(?=\||$)', line) if cell.strip()]

        if len(row_values) == len(headers):
            row_dict = dict(zip(headers, row_values))
            data.append(row_dict)

    return headers, data


def create_table_with_tooltips(data: List[Dict[str, str]],
                               columns: List[Tuple[str, str]],
                               tooltip_source: str) -> str:
    """
    Create a markdown table with tooltips from the parsed data.

    Args:
        data (List[Dict[str, str]]): List of dictionaries containing row data
        columns (List[Tuple[str, str]]): List of tuples containing (column_name, display_name)
        tooltip_source (str): The key in the data dictionary to use for tooltips

    Returns:
        str: Formatted markdown table with tooltips
    """
    headers = [col[1] for col in columns]
    table_data = []

    for row in data:
        row_data = []
        for col, _ in columns:
            if col in row:
                # If this is a column we want to add tooltips to
                value = row[col]
                if tooltip_source in row:
                    # Extract actual text from span if it exists
                    text_match = re.search(r'>([^<]+)</span>', value)
                    if text_match:
                        actual_text = text_match.group(1)
                    else:
                        actual_text = value

                    tooltip_text = row[tooltip_source]
                    value = f'<span data-toggle="tooltip" title="{tooltip_text}">{actual_text}</span>'
                row_data.append(value)
            else:
                row_data.append('')
        table_data.append(row_data)

    return tabulate(table_data, headers=headers, tablefmt="pipe")


def main():
    # Example usage
    with open('_tabs/trainings.md', 'r') as f:
        content = f.read()

    # Extract just the table portion
    table_start = content.find(
        '{: .table-responsive }') + len('{: .table-responsive }')
    table_content = content[table_start:].strip()

    # Parse the table
    headers, data = parse_markdown_table(table_content)

    # Define the columns we want in our output table
    # Format: (original_column_name, display_name)
    columns = [
        ('Certification', 'Certification'),
        ('Issuing Organization', 'Issuing Organization')
    ]

    # Create new table with tooltips
    new_table = create_table_with_tooltips(data, columns, 'Description')

    # Prepare the final content
    final_content = f'''---
title: Trainings
icon: fas fa-info-circle
order: 5
---

{{: .table-responsive }}

{new_table}
'''

    # Write the result back to the file
    with open('_tabs/trainings.md', 'w') as f:
        f.write(final_content)


if __name__ == "__main__":
    main()
