import { useEffect, useState } from "react"
import api from "@/api/axios"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { FiPlus } from "react-icons/fi"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Eye, EyeOff } from "lucide-react"

export default function AddAdminDialog({ onCreated = () => {} }) {
  const [open, setOpen] = useState(false)
  const [roles, setRoles] = useState([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [roleId, setRoleId] = useState("")
  const [saving, setSaving] = useState(false)

  const passwordStrong = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get("/roles")
        const list = Array.isArray(res.data) ? res.data : (res.data?.roles || [])
        const normalized = list.map(r => ({ id: String(r.id ?? r.role_id ?? r.id), name: String(r.name ?? r.role_name ?? r.name) }))
        if (cancelled) return
        setRoles(normalized)
        const admin = normalized.find(r => String(r.name).toLowerCase() === "admin")
        if (admin) setRoleId(String(admin.id))
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load roles")
      }
    }
    load()
    return () => { cancelled = true }
  }, [open])

  const create = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !roleId) {
      toast.error("Fill all fields")
      return
    }
    const strong = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)
    if (!strong) {
      toast.error("Password must be 8+ chars, include uppercase, number, and special character")
      return
    }
    setSaving(true)
    try {
      const payload = { name, email, password, roleId }
      await api.post("/users", payload)
      toast.success("Admin user created")
      setOpen(false)
      setName("")
      setEmail("")
      setPassword("")
      onCreated()
    } catch (e) {
      toast.error(e?.response?.data?.message || "Create failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Add Admin">
              <FiPlus className='text-primary' />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Add Admin</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Admin User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Admin" />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="relative mt-1">
              <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && !passwordStrong && (
              <p className="text-red-500 text-xs mt-1">Password must be 8+ chars and include uppercase, number, and special character</p>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Role</label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving || !passwordStrong}>{saving ? "Creating..." : "Create"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
