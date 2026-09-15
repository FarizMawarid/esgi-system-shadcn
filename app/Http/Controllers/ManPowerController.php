<?php

namespace App\Http\Controllers;

use App\Models\ManPower;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ManPowerController extends Controller
{
    /**
     * Display Man Power list with search and filters.
     */
    public function index(Request $request): Response
    {
        $query = ManPower::query();

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('nik', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('uid', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department') && $request->department !== 'all') {
            $query->where('department', $request->department);
        }

        if ($request->filled('line') && $request->line !== 'all') {
            $query->where('line', $request->line);
        }

        $perPage = (int) $request->input('per_page', 15);
        $manPowers = $query->orderBy('id', 'desc')->paginate($perPage)->withQueryString();

        $departments = ManPower::query()
            ->select('department')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->orderBy('department')
            ->pluck('department');

        $lines = ManPower::query()
            ->select('line')
            ->whereNotNull('line')
            ->where('line', '!=', '')
            ->distinct()
            ->orderBy('line')
            ->pluck('line');

        return Inertia::render('master/manpower/index', [
            'manPowers' => $manPowers,
            'departments' => $departments,
            'lines' => $lines,
            'filters' => [
                'search' => $request->input('search', ''),
                'department' => $request->input('department', 'all'),
                'line' => $request->input('line', 'all'),
                'per_page' => $perPage,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Store new Man Power.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nik' => ['required', 'string', 'max:255', Rule::unique('man_powers', 'nik')],
            'name' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'line' => ['required', 'string', 'max:255'],
            'uid' => ['required', 'string', 'max:255', Rule::unique('man_powers', 'uid')],
        ]);

        ManPower::create($validated);

        return back()->with('success', 'Man Power has been successfully added.');
    }

    /**
     * Update existing Man Power.
     */
    public function update(Request $request, int|string $id): RedirectResponse
    {
        $manPower = ManPower::findOrFail($id);

        $validated = $request->validate([
            'nik' => ['required', 'string', 'max:255', Rule::unique('man_powers', 'nik')->ignore($manPower->id)],
            'name' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'line' => ['required', 'string', 'max:255'],
            'uid' => ['required', 'string', 'max:255', Rule::unique('man_powers', 'uid')->ignore($manPower->id)],
        ]);

        $manPower->update($validated);

        return back()->with('success', 'Man Power has been successfully updated.');
    }

    /**
     * Delete Man Power.
     */
    public function destroy(int|string $id): RedirectResponse
    {
        $manPower = ManPower::findOrFail($id);
        $manPower->delete();

        return back()->with('success', 'Man Power has been successfully deleted.');
    }

    /**
     * Download Man Power template.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $headers = ['NIK', 'Name', 'Department', 'Line', 'UID'];
        $filename = 'man_power_template.csv';

        $callback = function () use ($headers) {
            $file = fopen('php://output', 'w');
            // UTF-8 BOM so Excel opens with proper encoding
            fwrite($file, "\xEF\xBB\xBF");
            // Semicolon separator for Excel compatibility
            fputcsv($file, $headers, ';');
            // Example row
            fputcsv($file, ['141400001', 'Budi Santoso', 'SEWING', 'Line 1', '0001234567'], ';');
            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Export Man Power data to Excel (.xlsx).
     */
    public function export(Request $request): StreamedResponse
    {
        $query = ManPower::query();

        if ($request->filled('department') && $request->department !== 'all') {
            $query->where('department', $request->department);
        }

        if ($request->filled('line') && $request->line !== 'all') {
            $query->where('line', $request->line);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('nik', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('uid', 'like', "%{$search}%");
            });
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Man Power Master');

        // Header
        $sheet->fromArray(['No', 'NIK', 'Name', 'Department', 'Line', 'UID'], null, 'A1');

        // Styling header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '06316A']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
        ];
        $sheet->getStyle('A1:F1')->applyFromArray($headerStyle);

        $rowNumber = 2;
        $counter = 1;

        $query->orderBy('nik')->chunk(500, function ($manPowers) use ($sheet, &$rowNumber, &$counter) {
            $data = [];
            foreach ($manPowers as $mp) {
                $data[] = [
                    $counter++,
                    (string) $mp->nik,
                    $mp->name,
                    $mp->department,
                    $mp->line,
                    (string) $mp->uid,
                ];
            }
            $sheet->fromArray($data, null, "A{$rowNumber}");
            $rowNumber += count($data);
        });

        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="man_power_master.xlsx"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Import Man Power from Excel (.xlsx, .xls) or CSV (.csv).
     */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:20480'],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        try {
            $rows = [];

            if (in_array($extension, ['xlsx', 'xls'])) {
                $path = $file->getRealPath();
                $reader = IOFactory::createReaderForFile($path);
                $reader->setReadDataOnly(true);
                $spreadsheet = $reader->load($path);
                $sheetData = $spreadsheet->getActiveSheet()->toArray(null, true, true, true);

                // Find header row
                $headerRow = null;
                $dataStart = 2;

                foreach ($sheetData as $rNum => $rData) {
                    $vals = array_map(fn($v) => strtolower(trim((string)$v)), array_values($rData));
                    if ((in_array('nik', $vals)) && (in_array('name', $vals) || in_array('nama', $vals))) {
                        $headerRow = $vals;
                        $dataStart = $rNum + 1;
                        break;
                    }
                }

                if (!$headerRow) {
                    return back()->with('error', 'Invalid header format. Required columns: NIK, Name, Department, Line, UID.');
                }

                $nikIdx = array_search('nik', $headerRow);
                $nameIdx = array_search('name', $headerRow);
                if ($nameIdx === false) {
                    $nameIdx = array_search('nama', $headerRow);
                }
                $deptIdx = array_search('department', $headerRow);
                $lineIdx = array_search('line', $headerRow);
                $uidIdx = array_search('uid', $headerRow);

                for ($i = $dataStart; $i <= count($sheetData); $i++) {
                    $cols = array_values($sheetData[$i]);
                    $rows[] = [
                        'nik' => trim((string)($cols[$nikIdx] ?? '')),
                        'name' => trim((string)($cols[$nameIdx] ?? '')),
                        'department' => trim((string)($cols[$deptIdx] ?? '')),
                        'line' => trim((string)($cols[$lineIdx] ?? '')),
                        'uid' => trim((string)($cols[$uidIdx] ?? '')),
                    ];
                }
            } else {
                // CSV
                $handle = fopen($file->getRealPath(), 'r');
                $firstLine = fgets($handle);
                $separator = str_contains($firstLine, ';') ? ';' : ',';
                rewind($handle);

                // Skip BOM
                $bom = fread($handle, 3);
                if ($bom !== "\xEF\xBB\xBF") {
                    rewind($handle);
                }

                $headers = fgetcsv($handle, 0, $separator);
                $headers = array_map(fn($h) => strtolower(trim((string)$h)), $headers ?: []);

                $nikIdx = array_search('nik', $headers);
                $nameIdx = array_search('name', $headers);
                if ($nameIdx === false) {
                    $nameIdx = array_search('nama', $headers);
                }
                $deptIdx = array_search('department', $headers);
                $lineIdx = array_search('line', $headers);
                $uidIdx = array_search('uid', $headers);

                while (($data = fgetcsv($handle, 0, $separator)) !== false) {
                    $rows[] = [
                        'nik' => trim((string)($data[$nikIdx] ?? '')),
                        'name' => trim((string)($data[$nameIdx] ?? '')),
                        'department' => trim((string)($data[$deptIdx] ?? '')),
                        'line' => trim((string)($data[$lineIdx] ?? '')),
                        'uid' => trim((string)($data[$uidIdx] ?? '')),
                    ];
                }
                fclose($handle);
            }

            $insert = 0;
            $update = 0;
            $skip = 0;

            DB::transaction(function () use ($rows, &$insert, &$update, &$skip) {
                foreach ($rows as $row) {
                    if ($row['nik'] === '' || $row['name'] === '') {
                        $skip++;
                        continue;
                    }

                    $manPower = ManPower::firstOrNew(['nik' => $row['nik']]);
                    $isNew = !$manPower->exists;

                    $manPower->fill([
                        'nik' => $row['nik'],
                        'name' => $row['name'],
                        'department' => $row['department'] ?: '-',
                        'line' => $row['line'] ?: '-',
                        'uid' => $row['uid'] ?: $row['nik'],
                    ]);

                    $manPower->save();

                    if ($isNew) {
                        $insert++;
                    } else {
                        $update++;
                    }
                }
            });

            return back()->with('success', "Import successfully processed. Inserted: {$insert} new records | Updated: {$update} records | Skipped: {$skip}");
        } catch (\Throwable $e) {
            return back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }
}
