import { useState, useEffect } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import { AuthenticatedLayout } from '@/layouts'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Filter,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Repeat,
  ArrowRightLeft,
  UserCheck,
  UserX,
  Calendar,
  Sparkles,
} from 'lucide-react'

interface ManPowerJumper {
  id: number
  man_power_id: number | null
  nik: string
  name: string
  department: string
  line: string
  proses_sebelumnya: string | null
  skill: string | null
  status_mutasi: string | null
  mutasi_department: string | null
  mutasi_line: string | null
  tanggal_mutasi: string | null
  tanggal_keluar: string | null
  keterangan_mutasi: string | null
  uid: string | null
  created_at: string
  updated_at: string
}

interface FactoryEmployee {
  id: number
  nik: string
  name: string
  department: string
  line: string
  uid: string | null
}

interface PaginationLinks {
  url: string | null
  label: string
  active: boolean
}

interface PaginatedData<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  links: PaginationLinks[]
}

interface Props {
  jumpers: PaginatedData<ManPowerJumper>
  stats: {
    total: number
    active: number
    transfer: number
    out: number
  }
  departments: string[]
  lines: string[]
  availableEmployees: FactoryEmployee[]
  filters: {
    search?: string
    department?: string
    line?: string
    status?: string
    per_page?: number
  }
  flash?: {
    success?: string
    error?: string
  }
}

export default function ManPowerJumperIndex({
  jumpers,
  stats,
  departments = [],
  lines = [],
  availableEmployees = [],
  filters = {},
  flash,
}: Props) {
  // Filter state
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [selectedDept, setSelectedDept] = useState(filters.department || 'all')
  const [selectedLine, setSelectedLine] = useState(filters.line || 'all')
  const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all')
  const [perPage, setPerPage] = useState(String(filters.per_page || 15))

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...departments.map((dept) => ({ value: dept, label: dept })),
  ]

  const lineOptions = [
    { value: 'all', label: 'All Lines' },
    ...lines.map((ln) => ({ value: ln, label: ln })),
  ]

  const employeeOptions = availableEmployees.map((emp) => ({
    value: String(emp.id),
    label: `${emp.nik} - ${emp.name} (${emp.department} / ${emp.line})`,
  }))

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isMutasiOpen, setIsMutasiOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<ManPowerJumper | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Selection mode in Add Modal: 'existing' (from factory) or 'manual'
  const [addMode, setAddMode] = useState<'existing' | 'manual'>('existing')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  // Form handling (Add)
  const addForm = useForm({
    man_power_id: '',
    nik: '',
    name: '',
    department: '',
    line: '',
    uid: '',
    proses_sebelumnya: '',
    skill: '',
    tanggal_mutasi: new Date().toISOString().split('T')[0],
  })

  // Form handling (Edit)
  const editForm = useForm({
    nik: '',
    name: '',
    department: '',
    line: '',
    uid: '',
    proses_sebelumnya: '',
    skill: '',
  })

  // Form handling (Mutation Status)
  const mutasiForm = useForm({
    mutation_action: 'Active',
    department: '',
    line: '',
    tanggal_mutasi: new Date().toISOString().split('T')[0],
    tanggal_keluar: '',
    out_reason: 'Resigned',
    keterangan_mutasi: '',
  })

  // Import form handling
  const importForm = useForm<{ file: File | null }>({
    file: null,
  })

  // Toast feedback
  useEffect(() => {
    if (flash?.success) toast.success(flash.success)
    if (flash?.error) toast.error(flash.error)
  }, [flash])

  // Handle filter submission
  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    router.get(
      route('man-power-jumper.index'),
      {
        search: searchTerm || undefined,
        department: selectedDept !== 'all' ? selectedDept : undefined,
        line: selectedLine !== 'all' ? selectedLine : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        per_page: perPage,
      },
      { preserveState: true, replace: true }
    )
  }

  // Handle reset filter
  const handleResetFilter = () => {
    setSearchTerm('')
    setSelectedDept('all')
    setSelectedLine('all')
    setSelectedStatus('all')
    setPerPage('15')
    router.get(route('man-power-jumper.index'), {}, { replace: true })
  }

  // Auto-fill when picking employee from availableEmployees
  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId)
    const emp = availableEmployees.find((e) => String(e.id) === empId)
    if (emp) {
      addForm.setData({
        ...addForm.data,
        man_power_id: String(emp.id),
        nik: emp.nik,
        name: emp.name,
        department: emp.department,
        line: emp.line,
        uid: emp.uid || '',
      })
    }
  }

  // Open Add modal
  const handleOpenAdd = () => {
    addForm.reset()
    addForm.clearErrors()
    addForm.setData('tanggal_mutasi', new Date().toISOString().split('T')[0])
    setSelectedEmployeeId('')
    setAddMode('existing')
    setIsAddOpen(true)
  }

  // Submit Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addForm.post(route('man-power-jumper.store'), {
      onSuccess: () => {
        setIsAddOpen(false)
        addForm.reset()
      },
    })
  }

  // Open Edit modal
  const handleOpenEdit = (item: ManPowerJumper) => {
    setActiveItem(item)
    editForm.setData({
      nik: item.nik,
      name: item.name,
      department: item.department,
      line: item.line,
      uid: item.uid || '',
      proses_sebelumnya: item.proses_sebelumnya || '',
      skill: item.skill || '',
    })
    editForm.clearErrors()
    setIsEditOpen(true)
  }

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItem) return
    editForm.put(route('man-power-jumper.update', activeItem.id), {
      onSuccess: () => {
        setIsEditOpen(false)
        setActiveItem(null)
      },
    })
  }

  // Open Mutation modal
  const handleOpenMutasi = (item: ManPowerJumper) => {
    setActiveItem(item)
    let action = 'Active'
    if (item.status_mutasi && (item.status_mutasi.includes('Mutasi') || item.status_mutasi.includes('Transfer'))) {
      action = 'Transfer'
    } else if (item.status_mutasi && (item.status_mutasi.includes('Keluar') || item.status_mutasi.includes('Out') || item.status_mutasi.includes('Resign'))) {
      action = 'Out'
    }

    mutasiForm.setData({
      mutation_action: action,
      department: item.mutasi_department || '',
      line: item.mutasi_line || '',
      tanggal_mutasi: item.tanggal_mutasi || new Date().toISOString().split('T')[0],
      tanggal_keluar: item.tanggal_keluar || new Date().toISOString().split('T')[0],
      out_reason: action === 'Out' ? (item.status_mutasi || 'Resigned') : 'Resigned',
      keterangan_mutasi: item.keterangan_mutasi || '',
    })
    mutasiForm.clearErrors()
    setIsMutasiOpen(true)
  }

  // Submit Mutation
  const handleMutasiSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItem) return
    mutasiForm.put(route('man-power-jumper.mutasi', activeItem.id), {
      onSuccess: () => {
        setIsMutasiOpen(false)
        setActiveItem(null)
      },
    })
  }

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (!deletingId) return
    router.delete(route('man-power-jumper.destroy', deletingId), {
      onSuccess: () => setDeletingId(null),
    })
  }

  // Submit Import
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!importForm.data.file) {
      toast.error('Please select an Excel or CSV file first')
      return
    }

    importForm.post(route('man-power-jumper.import'), {
      onSuccess: () => {
        setIsImportOpen(false)
        importForm.reset()
      },
    })
  }

  // Export URL
  const getExportUrl = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)
    if (selectedDept && selectedDept !== 'all') params.append('department', selectedDept)
    if (selectedLine && selectedLine !== 'all') params.append('line', selectedLine)
    return `${route('man-power-jumper.export')}?${params.toString()}`
  }

  return (
    <AuthenticatedLayout title="Man Power (Jumper)" withTopNav={false}>
      <Head title="ESGI System" />

      <Main>
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>Master</span>
              <span>/</span>
              <span className="font-semibold text-foreground">Man Power (Jumper)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Man Power (Jumper)</h1>
                <p className="text-xs text-muted-foreground">
                  Factory jumper personnel master data with line assignment and mutation tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Jumper
            </Button>

            <a href={route('man-power-jumper.template')} download>
              <Button variant="outline" size="sm" className="border-slate-200">
                <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
                Template
              </Button>
            </a>

            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              size="sm"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              Import Excel
            </Button>

            <a href={getExportUrl()}>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                Export Excel
              </Button>
            </a>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Jumpers</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{stats.total.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Repeat className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Jumpers</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{stats.active.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Transferred (Mutasi)</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{stats.transfer.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Resigned / Out</p>
                <p className="text-2xl font-bold mt-1 text-slate-600">{stats.out.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <UserX className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Card */}
        <Card className="mb-6 border-slate-100 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              Filter Jumper Personnel
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6">
            <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="space-y-1">
                <Label htmlFor="search" className="text-xs text-muted-foreground">
                  Search NIK / Name / Skill
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="search"
                    placeholder="Type keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <Label htmlFor="department" className="text-xs text-muted-foreground">
                  Department
                </Label>
                <Combobox
                  options={departmentOptions}
                  value={selectedDept}
                  onChange={setSelectedDept}
                  placeholder="Select Department"
                  searchPlaceholder="Type to search department..."
                />
              </div>

              {/* Line */}
              <div className="space-y-1">
                <Label htmlFor="line" className="text-xs text-muted-foreground">
                  Line
                </Label>
                <Combobox
                  options={lineOptions}
                  value={selectedLine}
                  onChange={setSelectedLine}
                  placeholder="Select Line"
                  searchPlaceholder="Type to search line..."
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs text-muted-foreground">
                  Status Mutasi
                </Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status" className="h-9 text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="transfer">Transferred (Mutasi)</SelectItem>
                    <SelectItem value="out">Resigned / Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-end gap-2">
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 h-9 flex-1">
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilter}
                  className="h-9 text-slate-600"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Data Table Card */}
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="py-3.5 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Man Power Jumper List</CardTitle>
              <CardDescription className="text-xs">
                Total records found: <span className="font-bold text-foreground">{jumpers.total.toLocaleString()}</span> jumpers
              </CardDescription>
            </div>

            {/* Per Page selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Show:</span>
              <Select
                value={perPage}
                onValueChange={(val) => {
                  setPerPage(val)
                  router.get(
                    route('man-power-jumper.index'),
                    {
                      search: searchTerm || undefined,
                      department: selectedDept !== 'all' ? selectedDept : undefined,
                      line: selectedLine !== 'all' ? selectedLine : undefined,
                      status: selectedStatus !== 'all' ? selectedStatus : undefined,
                      per_page: val,
                    },
                    { preserveState: true }
                  )
                }}
              >
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-12 text-center font-bold text-xs uppercase text-slate-600">No</TableHead>
                    <TableHead className="w-32 font-bold text-xs uppercase text-slate-600">NIK</TableHead>
                    <TableHead className="min-w-[160px] font-bold text-xs uppercase text-slate-600">Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-600">Origin Dept / Line</TableHead>
                    <TableHead className="min-w-[160px] font-bold text-xs uppercase text-slate-600">Skill / Previous Process</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-600">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-600">Dates</TableHead>
                    <TableHead className="w-32 text-right font-bold text-xs uppercase text-slate-600 pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jumpers.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-36 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Repeat className="w-8 h-8 text-slate-300" />
                          <p className="text-sm">No man power jumper records found.</p>
                          {(searchTerm || selectedDept !== 'all' || selectedLine !== 'all' || selectedStatus !== 'all') && (
                            <Button variant="link" size="sm" onClick={handleResetFilter}>
                              Clear search filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    jumpers.data.map((item, index) => {
                      const rowNumber = (jumpers.from || 1) + index
                      const isMutasi = item.status_mutasi && (item.status_mutasi.includes('Mutasi') || item.status_mutasi.includes('Transfer'))
                      const isOut = item.status_mutasi && (item.status_mutasi.includes('Keluar') || item.status_mutasi.includes('Out') || item.status_mutasi.includes('Resign'))

                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-blue-600">
                            {item.nik}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm text-foreground">{item.name}</div>
                            {item.uid && (
                              <div className="font-mono text-[11px] text-muted-foreground">
                                UID: {item.uid}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary" className="font-medium text-xs text-foreground">
                                {item.department || '-'}
                              </Badge>
                              <Badge variant="outline" className="font-medium text-xs text-slate-600 border-slate-200">
                                {item.line || '-'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              {item.skill && (
                                <div className="text-xs font-medium text-foreground">
                                  {item.skill}
                                </div>
                              )}
                              {item.proses_sebelumnya && (
                                <div className="text-[11px] text-muted-foreground">
                                  Prev: {item.proses_sebelumnya}
                                </div>
                              )}
                              {!item.skill && !item.proses_sebelumnya && (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isOut ? (
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                                Resigned / Out
                              </Badge>
                            ) : isMutasi ? (
                              <div className="space-y-1">
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs flex items-center gap-1 w-fit">
                                  <ArrowRightLeft className="w-3 h-3" />
                                  Transferred
                                </Badge>
                                {(item.mutasi_department || item.mutasi_line) && (
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    To: {item.mutasi_department || '-'} / {item.mutasi_line || '-'}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs flex items-center gap-1 w-fit">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-[11px] space-y-0.5 text-muted-foreground">
                              {item.tanggal_mutasi && (
                                <div>Join: <span className="font-medium text-foreground">{item.tanggal_mutasi}</span></div>
                              )}
                              {item.tanggal_keluar && (
                                <div>Exit: <span className="font-medium text-foreground">{item.tanggal_keluar}</span></div>
                              )}
                              {!item.tanggal_mutasi && !item.tanggal_keluar && <span>-</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenMutasi(item)}
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Update Mutation Status"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(item)}
                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                title="Edit Jumper"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingId(item.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete Jumper"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            {jumpers.total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/30">
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{jumpers.from || 0}</span> to{' '}
                  <span className="font-semibold text-foreground">{jumpers.to || 0}</span> of{' '}
                  <span className="font-semibold text-foreground">{jumpers.total.toLocaleString()}</span> entries
                </div>

                <div className="flex items-center gap-1">
                  {jumpers.links.map((link, idx) => {
                    const isPrev = link.label.includes('Previous') || link.label.includes('&laquo;')
                    const isNext = link.label.includes('Next') || link.label.includes('&raquo;')

                    if (!link.url && !link.active) {
                      return (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          disabled
                          className="h-8 px-2.5 text-xs opacity-50 border-slate-200"
                        >
                          {isPrev ? 'Prev' : isNext ? 'Next' : link.label}
                        </Button>
                      )
                    }

                    return (
                      <Button
                        key={idx}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                        className={`h-8 px-2.5 text-xs ${link.active
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        {isPrev ? 'Prev' : isNext ? 'Next' : link.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Main>

      {/* Modal Add Jumper */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-blue-600" />
              Register Man Power Jumper
            </DialogTitle>
            <DialogDescription>
              Select an employee from the factory master list or input new details.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-2">
            <button
              type="button"
              onClick={() => setAddMode('existing')}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${addMode === 'existing'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-foreground'
                }`}
            >
              Select from Factory Employee List
            </button>
            <button
              type="button"
              onClick={() => setAddMode('manual')}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${addMode === 'manual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-foreground'
                }`}
            >
              Manual Input
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            {addMode === 'existing' && (
              <div className="space-y-1.5">
                <Label htmlFor="select-emp" className="text-xs font-semibold">
                  Select Employee (Candidate) <span className="text-red-500">*</span>
                </Label>
                <Combobox
                  options={employeeOptions}
                  value={selectedEmployeeId}
                  onChange={handleSelectEmployee}
                  placeholder="Choose employee from factory..."
                  searchPlaceholder="Type NIK, name, or dept..."
                  emptyText="No matching employee found."
                  modal={true}
                />
                <p className="text-[11px] text-muted-foreground">
                  Type NIK or Name to quickly filter and select an employee.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-nik" className="text-xs font-semibold">
                  NIK <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-nik"
                  placeholder="e.g. 141400262"
                  value={addForm.data.nik}
                  onChange={(e) => addForm.setData('nik', e.target.value)}
                  className="h-9 font-mono"
                  readOnly={addMode === 'existing'}
                />
                {addForm.errors.nik && <p className="text-xs text-red-500">{addForm.errors.nik}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-name" className="text-xs font-semibold">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-name"
                  placeholder="Employee name..."
                  value={addForm.data.name}
                  onChange={(e) => addForm.setData('name', e.target.value)}
                  className="h-9"
                  readOnly={addMode === 'existing'}
                />
                {addForm.errors.name && <p className="text-xs text-red-500">{addForm.errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-dept" className="text-xs font-semibold">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-dept"
                  placeholder="e.g. SEWING"
                  value={addForm.data.department}
                  onChange={(e) => addForm.setData('department', e.target.value)}
                  className="h-9"
                  readOnly={addMode === 'existing'}
                />
                {addForm.errors.department && <p className="text-xs text-red-500">{addForm.errors.department}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-line" className="text-xs font-semibold">
                  Line <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-line"
                  placeholder="e.g. LINE 01"
                  value={addForm.data.line}
                  onChange={(e) => addForm.setData('line', e.target.value)}
                  className="h-9"
                  readOnly={addMode === 'existing'}
                />
                {addForm.errors.line && <p className="text-xs text-red-500">{addForm.errors.line}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-proc" className="text-xs font-semibold">
                  Previous Process (Proses Sebelumnya)
                </Label>
                <Input
                  id="add-proc"
                  placeholder="e.g. Jahit Manset, Pasang Kerah"
                  value={addForm.data.proses_sebelumnya}
                  onChange={(e) => addForm.setData('proses_sebelumnya', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-date" className="text-xs font-semibold">
                  Join / Mutation Date
                </Label>
                <Input
                  id="add-date"
                  type="date"
                  value={addForm.data.tanggal_mutasi}
                  onChange={(e) => addForm.setData('tanggal_mutasi', e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-skill" className="text-xs font-semibold">
                Special Skills & Qualifications
              </Label>
              <Textarea
                id="add-skill"
                placeholder="Detail the machine types, capabilities, or process specialties..."
                value={addForm.data.skill}
                onChange={(e) => addForm.setData('skill', e.target.value)}
                className="text-xs resize-none h-16"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={addForm.processing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addForm.processing || (!addForm.data.nik && addMode === 'existing')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {addForm.processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Register Jumper
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Jumper */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-600" />
              Edit Man Power Jumper
            </DialogTitle>
            <DialogDescription>
              Update information and skills for this jumper personnel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3.5 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-nik" className="text-xs font-semibold">NIK *</Label>
                <Input
                  id="edit-nik"
                  value={editForm.data.nik}
                  onChange={(e) => editForm.setData('nik', e.target.value)}
                  className="h-9 font-mono"
                />
                {editForm.errors.nik && <p className="text-xs text-red-500">{editForm.errors.nik}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.data.name}
                  onChange={(e) => editForm.setData('name', e.target.value)}
                  className="h-9"
                />
                {editForm.errors.name && <p className="text-xs text-red-500">{editForm.errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-dept" className="text-xs font-semibold">Department *</Label>
                <Input
                  id="edit-dept"
                  value={editForm.data.department}
                  onChange={(e) => editForm.setData('department', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-line" className="text-xs font-semibold">Line *</Label>
                <Input
                  id="edit-line"
                  value={editForm.data.line}
                  onChange={(e) => editForm.setData('line', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-proc" className="text-xs font-semibold">Previous Process</Label>
              <Input
                id="edit-proc"
                placeholder="e.g. Jahit Manset"
                value={editForm.data.proses_sebelumnya}
                onChange={(e) => editForm.setData('proses_sebelumnya', e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-skill" className="text-xs font-semibold">Skills & Qualifications</Label>
              <Textarea
                id="edit-skill"
                placeholder="Skill notes..."
                value={editForm.data.skill}
                onChange={(e) => editForm.setData('skill', e.target.value)}
                className="text-xs resize-none h-20"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={editForm.processing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editForm.processing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editForm.processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Mutation Status (Mutasi) */}
      <Dialog open={isMutasiOpen} onOpenChange={setIsMutasiOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <ArrowRightLeft className="w-5 h-5" />
              Manage Mutation Status
            </DialogTitle>
            <DialogDescription>
              Update status for <span className="font-semibold text-foreground">{activeItem?.name}</span> ({activeItem?.nik}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMutasiSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mutation Action</Label>
              <Select
                value={mutasiForm.data.mutation_action}
                onValueChange={(val) => mutasiForm.setData('mutation_action', val)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active (Reset to Active Jumper)</SelectItem>
                  <SelectItem value="Transfer">Transfer / Mutasi (Move to Another Dept / Line)</SelectItem>
                  <SelectItem value="Out">Out / Resigned (Employee Departed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mutasiForm.data.mutation_action === 'Transfer' && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                  Transfer Destination Details
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="mut-dept" className="text-xs">Destination Dept</Label>
                    <Input
                      id="mut-dept"
                      placeholder="e.g. CUTTING"
                      value={mutasiForm.data.department}
                      onChange={(e) => mutasiForm.setData('department', e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mut-line" className="text-xs">Destination Line</Label>
                    <Input
                      id="mut-line"
                      placeholder="e.g. LINE 05"
                      value={mutasiForm.data.line}
                      onChange={(e) => mutasiForm.setData('line', e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mut-date" className="text-xs">Transfer Effective Date</Label>
                  <Input
                    id="mut-date"
                    type="date"
                    value={mutasiForm.data.tanggal_keluar}
                    onChange={(e) => mutasiForm.setData('tanggal_keluar', e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {mutasiForm.data.mutation_action === 'Out' && (
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-rose-600" />
                  Departure Reason & Date
                </div>
                <div className="space-y-1">
                  <Label htmlFor="out-reason" className="text-xs">Reason for Departure</Label>
                  <Input
                    id="out-reason"
                    placeholder="e.g. Resigned, End of Contract, Personal"
                    value={mutasiForm.data.out_reason}
                    onChange={(e) => mutasiForm.setData('out_reason', e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="out-date" className="text-xs">Exit Date</Label>
                  <Input
                    id="out-date"
                    type="date"
                    value={mutasiForm.data.tanggal_keluar}
                    onChange={(e) => mutasiForm.setData('tanggal_keluar', e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="mut-remarks" className="text-xs font-semibold">Remarks / Notes</Label>
              <Textarea
                id="mut-remarks"
                placeholder="Additional notes about this status change..."
                value={mutasiForm.data.keterangan_mutasi}
                onChange={(e) => mutasiForm.setData('keterangan_mutasi', e.target.value)}
                className="text-xs resize-none h-16"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMutasiOpen(false)}
                disabled={mutasiForm.processing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutasiForm.processing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {mutasiForm.processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Apply Mutation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Import Excel / CSV */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
              Import Man Power Jumper Data
            </DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx, .xls) or CSV (.csv) file to bulk add or update jumper records.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Required Column Format:
              </div>
              <p className="font-mono bg-white p-1.5 rounded border border-slate-200 text-[11px]">
                NIK ; Name ; Department ; Line ; UID ; Previous Process ; Skill
              </p>
              <p className="text-slate-500">
                If the NIK already exists in the database, the jumper details will be updated automatically.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-file" className="text-xs font-semibold">
                Choose Spreadsheet File:
              </Label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  importForm.setData('file', file)
                }}
                className="cursor-pointer file:cursor-pointer"
              />
              {importForm.errors.file && (
                <p className="text-xs text-red-500">{importForm.errors.file}</p>
              )}
            </div>

            <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
              <a href={route('man-power-jumper.template')} download className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                Download CSV Template
              </a>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportOpen(false)}
                  disabled={importForm.processing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={importForm.processing || !importForm.data.file}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {importForm.processing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Process Import
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Confirm Delete Jumper
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this employee from the jumper list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete Jumper
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  )
}
