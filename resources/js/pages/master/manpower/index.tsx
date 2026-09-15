import { useState, useEffect } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import { AuthenticatedLayout } from '@/layouts'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'

interface ManPower {
  id: number
  nik: string
  name: string
  department: string
  line: string
  uid: string
  created_at: string
  updated_at: string
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
  manPowers: PaginatedData<ManPower>
  departments: string[]
  lines: string[]
  filters: {
    search?: string
    department?: string
    line?: string
    per_page?: number
  }
  flash?: {
    success?: string
    error?: string
  }
}

export default function ManPowerIndex({
  manPowers,
  departments = [],
  lines = [],
  filters = {},
  flash,
}: Props) {
  // Filter state
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [selectedDept, setSelectedDept] = useState(filters.department || 'all')
  const [selectedLine, setSelectedLine] = useState(filters.line || 'all')
  const [perPage, setPerPage] = useState(String(filters.per_page || 15))

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ManPower | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Form handling (Create / Update)
  const form = useForm({
    nik: '',
    name: '',
    department: '',
    line: '',
    uid: '',
  })

  // Import form handling
  const importForm = useForm<{ file: File | null }>({
    file: null,
  })

  // Toast feedback
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success)
    }
    if (flash?.error) {
      toast.error(flash.error)
    }
  }, [flash])

  // Handle filter submission
  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    router.get(
      route('man-power.index'),
      {
        search: searchTerm || undefined,
        department: selectedDept !== 'all' ? selectedDept : undefined,
        line: selectedLine !== 'all' ? selectedLine : undefined,
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
    setPerPage('15')
    router.get(route('man-power.index'), {}, { replace: true })
  }

  // Open Create modal
  const handleOpenCreate = () => {
    setEditingItem(null)
    form.reset()
    form.clearErrors()
    setIsFormOpen(true)
  }

  // Open Edit modal
  const handleOpenEdit = (item: ManPower) => {
    setEditingItem(item)
    form.setData({
      nik: item.nik,
      name: item.name,
      department: item.department,
      line: item.line,
      uid: item.uid,
    })
    form.clearErrors()
    setIsFormOpen(true)
  }

  // Submit Create / Edit form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      form.put(route('man-power.update', editingItem.id), {
        onSuccess: () => {
          setIsFormOpen(false)
          form.reset()
        },
      })
    } else {
      form.post(route('man-power.store'), {
        onSuccess: () => {
          setIsFormOpen(false)
          form.reset()
        },
      })
    }
  }

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (!deletingId) return
    router.delete(route('man-power.destroy', deletingId), {
      onSuccess: () => setDeletingId(null),
    })
  }

  // Submit Import form
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!importForm.data.file) {
      toast.error('Please select an Excel or CSV file first')
      return
    }

    importForm.post(route('man-power.import'), {
      onSuccess: () => {
        setIsImportOpen(false)
        importForm.reset()
      },
    })
  }

  // Build Export URL with current active filters
  const getExportUrl = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)
    if (selectedDept && selectedDept !== 'all') params.append('department', selectedDept)
    if (selectedLine && selectedLine !== 'all') params.append('line', selectedLine)
    return `${route('man-power.export')}?${params.toString()}`
  }

  return (
    <AuthenticatedLayout title="Man Power (Factory)" withTopNav={false}>
      <Head title="ESGI System" />

      <Main>
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>Master</span>
              <span>/</span>
              <span className="font-semibold text-foreground">Man Power (Factory)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Man Power (Factory)</h1>
                <p className="text-xs text-muted-foreground">
                  Factory employee master data with input, export, and import features.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Data
            </Button>

            <a href={route('man-power.template')} download>
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

        {/* Filter Card */}
        <Card className="mb-6 border-slate-100 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              Filter Man Power Data
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6">
            <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="space-y-1">
                <Label htmlFor="search" className="text-xs text-muted-foreground">
                  Search NIK / Name / UID
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
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger id="department" className="h-9 text-sm">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Line */}
              <div className="space-y-1">
                <Label htmlFor="line" className="text-xs text-muted-foreground">
                  Line
                </Label>
                <Select value={selectedLine} onValueChange={setSelectedLine}>
                  <SelectTrigger id="line" className="h-9 text-sm">
                    <SelectValue placeholder="Select Line" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lines</SelectItem>
                    {lines.map((ln) => (
                      <SelectItem key={ln} value={ln}>
                        {ln}
                      </SelectItem>
                    ))}
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
              <CardTitle className="text-sm font-semibold">Man Power Employee List</CardTitle>
              <CardDescription className="text-xs">
                Total records found: <span className="font-bold text-foreground">{manPowers.total.toLocaleString()}</span> employees
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
                    route('man-power.index'),
                    {
                      search: searchTerm || undefined,
                      department: selectedDept !== 'all' ? selectedDept : undefined,
                      line: selectedLine !== 'all' ? selectedLine : undefined,
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
                    <TableHead className="w-14 text-center font-bold text-xs uppercase text-slate-600">No</TableHead>
                    <TableHead className="w-36 font-bold text-xs uppercase text-slate-600">NIK</TableHead>
                    <TableHead className="min-w-[180px] font-bold text-xs uppercase text-slate-600">Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-600">Department</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-600">Line</TableHead>
                    <TableHead className="w-36 font-bold text-xs uppercase text-slate-600">UID</TableHead>
                    <TableHead className="w-28 text-right font-bold text-xs uppercase text-slate-600 pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manPowers.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-36 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-8 h-8 text-slate-300" />
                          <p className="text-sm">No man power records found.</p>
                          {(searchTerm || selectedDept !== 'all' || selectedLine !== 'all') && (
                            <Button variant="link" size="sm" onClick={handleResetFilter}>
                              Clear search filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    manPowers.data.map((item, index) => {
                      const rowNumber = (manPowers.from || 1) + index
                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-blue-600">
                            {item.nik}
                          </TableCell>
                          <TableCell className="font-medium text-sm text-foreground">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-medium text-sm text-foreground">
                              {item.department || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-medium text-sm text-foreground">
                              {item.line || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {item.uid || '-'}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(item)}
                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                title="Edit Man Power"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingId(item.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete Man Power"
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
            {manPowers.total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/30">
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{manPowers.from || 0}</span> to{' '}
                  <span className="font-semibold text-foreground">{manPowers.to || 0}</span> of{' '}
                  <span className="font-semibold text-foreground">{manPowers.total.toLocaleString()}</span> entries
                </div>

                <div className="flex items-center gap-1">
                  {manPowers.links.map((link, idx) => {
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

      {/* Modal Add / Edit Man Power */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {editingItem ? 'Edit Man Power' : 'Add Man Power'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update employee details in the form below.'
                : 'Fill in the form to register a new factory employee.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="form-nik" className="text-xs font-semibold">
                NIK (Employee ID) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="form-nik"
                placeholder="e.g. 141400262"
                value={form.data.nik}
                onChange={(e) => form.setData('nik', e.target.value)}
                className="h-9 font-mono"
              />
              {form.errors.nik && <p className="text-xs text-red-500">{form.errors.nik}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-name" className="text-xs font-semibold">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="form-name"
                placeholder="Employee full name..."
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                className="h-9"
              />
              {form.errors.name && <p className="text-xs text-red-500">{form.errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="form-department" className="text-xs font-semibold">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="form-department"
                  placeholder="e.g. SEWING, QC"
                  value={form.data.department}
                  onChange={(e) => form.setData('department', e.target.value)}
                  className="h-9"
                />
                {form.errors.department && (
                  <p className="text-xs text-red-500">{form.errors.department}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-line" className="text-xs font-semibold">
                  Line <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="form-line"
                  placeholder="e.g. Line 1 / -"
                  value={form.data.line}
                  onChange={(e) => form.setData('line', e.target.value)}
                  className="h-9"
                />
                {form.errors.line && <p className="text-xs text-red-500">{form.errors.line}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-uid" className="text-xs font-semibold">
                UID (RFID / Card Barcode) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="form-uid"
                placeholder="e.g. 0009392506"
                value={form.data.uid}
                onChange={(e) => form.setData('uid', e.target.value)}
                className="h-9 font-mono"
              />
              {form.errors.uid && <p className="text-xs text-red-500">{form.errors.uid}</p>}
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={form.processing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.processing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {form.processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem ? 'Save Changes' : 'Add Employee'}
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
              Import Man Power Data
            </DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx, .xls) or CSV (.csv) file to bulk add or update records.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Required Column Format:
              </div>
              <p className="font-mono bg-white p-1.5 rounded border border-slate-200 text-[11px]">
                NIK ; Name ; Department ; Line ; UID
              </p>
              <p className="text-slate-500">
                If the NIK already exists in the database, the record will be updated automatically.
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
              <a href={route('man-power.template')} download className="text-xs text-blue-600 hover:underline flex items-center gap-1">
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
              Confirm Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  )
}
