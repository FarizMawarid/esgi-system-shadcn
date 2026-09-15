<?php

namespace App\Http\Controllers;

use App\Models\ManPower;
use App\Models\ManPowerJumper;
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

class ManPowerJumperController extends Controller
{
    /**
     * Display Man Power Jumper list with filters and stats.
     */
    public function index(Request $request): Response
    {
        $query = ManPowerJumper::query();

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('nik', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('uid', 'like', "%{$search}%")
                  ->orWhere('proses_sebelumnya', 'like', "%{$search}%")
                  ->orWhere('skill', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department') && $request->department !== 'all') {
            $query->where('department', $request->department);
        }

        if ($request->filled('line') && $request->line !== 'all') {
            $query->where('line', $request->line);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $status = $request->status;
            if ($status === 'active') {
                $query->where(function ($q) {
                    $q->whereNull('status_mutasi')
                      ->orWhereIn('status_mutasi', ['Aktif', 'Active']);
                });
            } elseif ($status === 'transfer') {
                $query->where(function ($q) {
                    $q->where('status_mutasi', 'Mutasi')
                      ->orWhere('status_mutasi', 'like', 'Mutasi%')
                      ->orWhere('status_mutasi', 'like', 'Transfer%');
                });
            } elseif ($status === 'out') {
                $query->where(function ($q) {
                    $q->where('status_mutasi', 'Keluar')
                      ->orWhere('status_mutasi', 'like', 'Keluar%')
                      ->orWhere('status_mutasi', 'like', 'Out%');
                });
            }
        }

        $perPage = (int) $request->input('per_page', 15);
        $jumpers = $query->orderBy('id', 'desc')->paginate($perPage)->withQueryString();

        // Statistics
        $totalCount = ManPowerJumper::count();
        $activeCount = ManPowerJumper::where(function ($q) {
            $q->whereNull('status_mutasi')
              ->orWhereIn('status_mutasi', ['Aktif', 'Active']);
        })->count();
        $transferCount = ManPowerJumper::where(function ($q) {
            $q->where('status_mutasi', 'Mutasi')
              ->orWhere('status_mutasi', 'like', 'Mutasi%')
              ->orWhere('status_mutasi', 'like', 'Transfer%');
        })->count();
        $outCount = ManPowerJumper::where(function ($q) {
            $q->where('status_mutasi', 'Keluar')
              ->orWhere('status_mutasi', 'like', 'Keluar%')
              ->orWhere('status_mutasi', 'like', 'Out%');
        })->count();

        // Distinct departments & lines
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

        // Available factory employees not yet registered as jumpers
        $existingJumperNiks = ManPowerJumper::pluck('nik')->filter()->toArray();
        $availableEmployees = ManPower::query()
            ->whereNotIn('nik', $existingJumperNiks)
            ->select('id', 'nik', 'name', 'department', 'line', 'uid')
            ->orderBy('name')
            ->limit(300)
            ->get();

        return Inertia::render('master/manpower-jumper/index', [
            'jumpers' => $jumpers,
            'stats' => [
                'total' => $totalCount,
                'active' => $activeCount,
                'transfer' => $transferCount,
                'out' => $outCount,
            ],
            'departments' => $departments,
            'lines' => $lines,
            'availableEmployees' => $availableEmployees,
            'filters' => [
                'search' => $request->input('search', ''),
                'department' => $request->input('department', 'all'),
                'line' => $request->input('line', 'all'),
                'status' => $request->input('status', 'all'),
                'per_page' => $perPage,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Search available factory employees for autocomplete.
     */
    public function searchManPower(Request $request)
    {
        $search = trim($request->input('q', ''));
        $existingNiks = ManPowerJumper::pluck('nik')->filter()->toArray();

        $query = ManPower::query()->whereNotIn('nik', $existingNiks);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('nik', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('uid', 'like', "%{$search}%");
            });
        }

        return response()->json($query->limit(50)->get());
    }

    /**
     * Store new Man Power Jumper.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nik' => ['required', 'string', 'max:255', Rule::unique('man_power_jumpers', 'nik')],
            'name' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'line' => ['required', 'string', 'max:255'],
            'uid' => ['nullable', 'string', 'max:255', Rule::unique('man_power_jumpers', 'uid')],
            'proses_sebelumnya' => ['nullable', 'string', 'max:255'],
            'skill' => ['nullable', 'string', 'max:1000'],
            'tanggal_mutasi' => ['nullable', 'date'],
            'man_power_id' => ['nullable', 'integer'],
        ]);

        $manPowerId = $validated['man_power_id'] ?? null;
        if (!$manPowerId) {
            $mp = ManPower::where('nik', $validated['nik'])->first();
            $manPowerId = $mp?->id;
        }

        ManPowerJumper::create([
            'man_power_id' => $manPowerId,
            'nik' => $validated['nik'],
            'name' => $validated['name'],
            'department' => $validated['department'],
            'line' => $validated['line'],
            'uid' => $validated['uid'] ?? null,
            'proses_sebelumnya' => $validated['proses_sebelumnya'] ?? null,
            'skill' => $validated['skill'] ?? null,
            'status_mutasi' => 'Aktif',
            'tanggal_mutasi' => $validated['tanggal_mutasi'] ?? now()->format('Y-m-d'),
        ]);

        return back()->with('success', 'Man Power Jumper has been successfully registered.');
    }

    /**
     * Update existing Man Power Jumper.
     */
    public function update(Request $request, int|string $id): RedirectResponse
    {
        $jumper = ManPowerJumper::findOrFail($id);

        $validated = $request->validate([
            'nik' => ['required', 'string', 'max:255', Rule::unique('man_power_jumpers', 'nik')->ignore($jumper->id)],
            'name' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'line' => ['required', 'string', 'max:255'],
            'uid' => ['nullable', 'string', 'max:255', Rule::unique('man_power_jumpers', 'uid')->ignore($jumper->id)],
            'proses_sebelumnya' => ['nullable', 'string', 'max:255'],
            'skill' => ['nullable', 'string', 'max:1000'],
        ]);

        $jumper->update($validated);

        return back()->with('success', 'Man Power Jumper details have been successfully updated.');
    }

    /**
     * Update mutation status (Active, Transfer, Out).
     */
    public function updateMutasi(Request $request, int|string $id): RedirectResponse
    {
        $jumper = ManPowerJumper::findOrFail($id);

        $request->validate([
            'mutation_action' => ['required', 'string', 'in:Active,Transfer,Out'],
            'department' => ['nullable', 'string', 'max:255'],
            'line' => ['nullable', 'string', 'max:255'],
            'tanggal_mutasi' => ['nullable', 'date'],
            'tanggal_keluar' => ['nullable', 'date'],
            'keterangan_mutasi' => ['nullable', 'string', 'max:1000'],
            'out_reason' => ['nullable', 'string', 'max:255'],
        ]);

        $action = $request->input('mutation_action');

        if ($action === 'Active') {
            $jumper->update([
                'status_mutasi' => 'Aktif',
                'mutasi_department' => null,
                'mutasi_line' => null,
                'tanggal_keluar' => null,
                'keterangan_mutasi' => $request->input('keterangan_mutasi'),
            ]);
        } elseif ($action === 'Transfer') {
            $effectiveDate = $request->input('tanggal_mutasi') ?: ($request->input('tanggal_keluar') ?: now()->format('Y-m-d'));
            $jumper->update([
                'status_mutasi' => 'Mutasi',
                'mutasi_department' => $request->input('department'),
                'mutasi_line' => $request->input('line'),
                'tanggal_keluar' => $effectiveDate,
                'keterangan_mutasi' => $request->input('keterangan_mutasi'),
            ]);
        } elseif ($action === 'Out') {
            $reason = $request->input('out_reason') ?: 'Out';
            $jumper->update([
                'status_mutasi' => $reason,
                'mutasi_department' => null,
                'mutasi_line' => null,
                'tanggal_keluar' => $request->input('tanggal_keluar') ?: now()->format('Y-m-d'),
                'keterangan_mutasi' => $request->input('keterangan_mutasi'),
            ]);
        }

        return back()->with('success', 'Jumper mutation status has been successfully updated.');
    }

    /**
     * Delete Man Power Jumper.
     */
    public function destroy(int|string $id): RedirectResponse
    {
        $jumper = ManPowerJumper::findOrFail($id);
        $jumper->delete();

        return back()->with('success', 'Man Power Jumper has been successfully deleted.');
    }

    /**
     * Export Man Power Jumper list to Excel.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = ManPowerJumper::query();

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
        $sheet->setTitle('Man Power Jumper Master');

        // Header
        $headers = [
            'No', 'NIK', 'Name', 'Origin Department', 'Origin Line',
            'Previous Process', 'Skill', 'Status', 'Join Date',
            'Exit/Transfer Date', 'Transferred Dept', 'Transferred Line', 'Remarks'
        ];
        $sheet->fromArray($headers, null, 'A1');

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '06316A']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
        ];
        $sheet->getStyle('A1:M1')->applyFromArray($headerStyle);

        $rowNumber = 2;
        $counter = 1;

        $jumpers = $query->orderBy('id', 'asc')->get();
        $data = [];

        foreach ($jumpers as $j) {
            $statusLabel = 'Active';
            if ($j->status_mutasi && !in_array($j->status_mutasi, ['Aktif', 'Active'])) {
                $statusLabel = str_starts_with($j->status_mutasi, 'Mutasi') ? 'Transferred' : $j->status_mutasi;
            }

            $data[] = [
                $counter++,
                (string) $j->nik,
                $j->name,
                $j->department,
                $j->line,
                $j->proses_sebelumnya ?: '-',
                $j->skill ?: '-',
                $statusLabel,
                $j->tanggal_mutasi ? $j->tanggal_mutasi->format('d/m/Y') : '-',
                $j->tanggal_keluar ? $j->tanggal_keluar->format('d/m/Y') : '-',
                $j->mutasi_department ?: '-',
                $j->mutasi_line ?: '-',
                $j->keterangan_mutasi ?: '-',
            ];
        }

        if ($data) {
            $sheet->fromArray($data, null, "A{$rowNumber}");
        }

        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="man_power_jumper_master.xlsx"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Download CSV template.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $headers = ['NIK', 'Name', 'Department', 'Line', 'UID', 'Previous Process', 'Skill'];
        $filename = 'man_power_jumper_template.csv';

        $callback = function () use ($headers) {
            $file = fopen('php://output', 'w');
            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, $headers, ';');
            fputcsv($file, ['141400001', 'Budi Santoso', 'SEWING', 'Line 1', '0001234567', 'Jahit Manset', 'Obras, Overdeck'], ';');
            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Import jumpers from spreadsheet.
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

                $headerRow = null;
                $dataStart = 2;

                foreach ($sheetData as $rNum => $rData) {
                    $vals = array_map(fn($v) => strtolower(trim((string)$v)), array_values($rData));
                    if (in_array('nik', $vals) && (in_array('name', $vals) || in_array('nama', $vals))) {
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
                if ($nameIdx === false) $nameIdx = array_search('nama', $headerRow);
                $deptIdx = array_search('department', $headerRow);
                $lineIdx = array_search('line', $headerRow);
                $uidIdx = array_search('uid', $headerRow);
                $procIdx = array_search('previous process', $headerRow);
                if ($procIdx === false) $procIdx = array_search('proses_sebelumnya', $headerRow);
                $skillIdx = array_search('skill', $headerRow);

                for ($i = $dataStart; $i <= count($sheetData); $i++) {
                    $cols = array_values($sheetData[$i]);
                    $rows[] = [
                        'nik' => trim((string)($cols[$nikIdx] ?? '')),
                        'name' => trim((string)($cols[$nameIdx] ?? '')),
                        'department' => trim((string)($cols[$deptIdx] ?? '')),
                        'line' => trim((string)($cols[$lineIdx] ?? '')),
                        'uid' => trim((string)($cols[$uidIdx] ?? '')),
                        'proses_sebelumnya' => $procIdx !== false ? trim((string)($cols[$procIdx] ?? '')) : null,
                        'skill' => $skillIdx !== false ? trim((string)($cols[$skillIdx] ?? '')) : null,
                    ];
                }
            } else {
                $handle = fopen($file->getRealPath(), 'r');
                $firstLine = fgets($handle);
                $separator = str_contains($firstLine, ';') ? ';' : ',';
                rewind($handle);

                $bom = fread($handle, 3);
                if ($bom !== "\xEF\xBB\xBF") {
                    rewind($handle);
                }

                $headers = fgetcsv($handle, 0, $separator);
                $headers = array_map(fn($h) => strtolower(trim((string)$h)), $headers ?: []);

                $nikIdx = array_search('nik', $headers);
                $nameIdx = array_search('name', $headers);
                if ($nameIdx === false) $nameIdx = array_search('nama', $headers);
                $deptIdx = array_search('department', $headers);
                $lineIdx = array_search('line', $headers);
                $uidIdx = array_search('uid', $headers);
                $procIdx = array_search('previous process', $headers);
                if ($procIdx === false) $procIdx = array_search('proses_sebelumnya', $headers);
                $skillIdx = array_search('skill', $headers);

                while (($data = fgetcsv($handle, 0, $separator)) !== false) {
                    $rows[] = [
                        'nik' => trim((string)($data[$nikIdx] ?? '')),
                        'name' => trim((string)($data[$nameIdx] ?? '')),
                        'department' => trim((string)($data[$deptIdx] ?? '')),
                        'line' => trim((string)($data[$lineIdx] ?? '')),
                        'uid' => trim((string)($data[$uidIdx] ?? '')),
                        'proses_sebelumnya' => $procIdx !== false ? trim((string)($data[$procIdx] ?? '')) : null,
                        'skill' => $skillIdx !== false ? trim((string)($data[$skillIdx] ?? '')) : null,
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

                    $mp = ManPower::where('nik', $row['nik'])->first();
                    $jumper = ManPowerJumper::firstOrNew(['nik' => $row['nik']]);
                    $isNew = !$jumper->exists;

                    $jumper->fill([
                        'man_power_id' => $mp?->id,
                        'nik' => $row['nik'],
                        'name' => $row['name'],
                        'department' => $row['department'] ?: '-',
                        'line' => $row['line'] ?: '-',
                        'uid' => $row['uid'] ?: $row['nik'],
                        'proses_sebelumnya' => $row['proses_sebelumnya'] ?: null,
                        'skill' => $row['skill'] ?: null,
                        'status_mutasi' => $isNew ? 'Aktif' : $jumper->status_mutasi,
                        'tanggal_mutasi' => $isNew ? now()->format('Y-m-d') : $jumper->tanggal_mutasi,
                    ]);

                    $jumper->save();

                    if ($isNew) {
                        $insert++;
                    } else {
                        $update++;
                    }
                }
            });

            return back()->with('success', "Import processed successfully. Inserted: {$insert} | Updated: {$update} | Skipped: {$skip}");
        } catch (\Throwable $e) {
            return back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }
}
