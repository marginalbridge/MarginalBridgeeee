"use client";

import { formatDate } from "@/lib/format";
import type { PublicUser, UserStatus } from "@/types/user";
import {
  CheckCircle2,
  Gift,
  Loader2,
  Percent,
  Save,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const STATUS_LABELS: Record<UserStatus, string> = {
  pending: "Onay Bekliyor",
  active: "Aktif",
  suspended: "Askıya Alındı",
};

export function UserManagement() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [edits, setEdits] = useState<
    Record<
      string,
      {
        status: UserStatus;
        discountPercent: number;
        freeTrialStart: string;
        freeTrialEnd: string;
      }
    >
  >({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kullanıcılar yüklenemedi.");
        return;
      }
      setUsers(data.users);
      const initial: typeof edits = {};
      for (const user of data.users as PublicUser[]) {
        initial[user.id] = {
          status: user.status,
          discountPercent: user.discountPercent,
          freeTrialStart: user.freeTrialStart
            ? user.freeTrialStart.slice(0, 10)
            : "",
          freeTrialEnd: user.freeTrialEnd
            ? user.freeTrialEnd.slice(0, 10)
            : "",
        };
      }
      setEdits(initial);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function updateEdit(
    userId: string,
    field: keyof (typeof edits)[string],
    value: string | number
  ) {
    setEdits((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  }

  async function saveUser(userId: string) {
    const edit = edits[userId];
    if (!edit) return;

    setSavingId(userId);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          status: edit.status,
          discountPercent: edit.discountPercent,
          freeTrialStart: edit.freeTrialStart
            ? new Date(edit.freeTrialStart).toISOString()
            : null,
          freeTrialEnd: edit.freeTrialEnd
            ? new Date(edit.freeTrialEnd + "T23:59:59").toISOString()
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kayıt başarısız.");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? data.user : u))
      );
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSavingId(null);
    }
  }

  function grantTrialDays(userId: string, days: number) {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    setEdits((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        status: "active",
        freeTrialStart: start.toISOString().slice(0, 10),
        freeTrialEnd: end.toISOString().slice(0, 10),
      },
    }));
  }

  const inputClass =
    "w-full rounded-lg border border-surface-border bg-gray-50 px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-bridge-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-bridge-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Kullanıcı</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">İndirim %</th>
                <th className="px-4 py-3 font-medium">Ücretsiz Deneme</th>
                <th className="px-4 py-3 font-medium">Erişim</th>
                <th className="px-4 py-3 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => {
                const edit = edits[user.id];
                if (!edit) return null;

                return (
                  <tr key={user.id} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        {user.role === "admin" ? (
                          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-bridge-600" />
                        ) : (
                          <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-600">{user.company}</p>
                          <p className="mt-1 text-xs text-gray-600">
                            Kayıt: {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {user.role === "admin" ? (
                        <span className="badge-info">Yönetici</span>
                      ) : (
                        <select
                          value={edit.status}
                          onChange={(e) =>
                            updateEdit(
                              user.id,
                              "status",
                              e.target.value as UserStatus
                            )
                          }
                          className={inputClass}
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {user.role === "admin" ? (
                        <span className="text-gray-500">—</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Percent className="h-3.5 w-3.5 text-gray-500" />
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={edit.discountPercent}
                            onChange={(e) =>
                              updateEdit(
                                user.id,
                                "discountPercent",
                                Number(e.target.value)
                              )
                            }
                            className={`${inputClass} w-20`}
                          />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {user.role === "admin" ? (
                        <span className="text-gray-500">—</span>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={edit.freeTrialStart}
                            onChange={(e) =>
                              updateEdit(user.id, "freeTrialStart", e.target.value)
                            }
                            className={inputClass}
                          />
                          <input
                            type="date"
                            value={edit.freeTrialEnd}
                            onChange={(e) =>
                              updateEdit(user.id, "freeTrialEnd", e.target.value)
                            }
                            className={inputClass}
                          />
                          <div className="flex flex-wrap gap-1">
                            {[7, 14, 30].map((days) => (
                              <button
                                key={days}
                                type="button"
                                onClick={() => grantTrialDays(user.id, days)}
                                className="rounded bg-bridge-50 px-2 py-0.5 text-xs text-bridge-700 hover:bg-bridge-100"
                              >
                                {days} gün
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {user.role === "admin" ? (
                        <span className="badge-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Tam Erişim
                        </span>
                      ) : user.hasActiveAccess ? (
                        <span className="badge-success">
                          <Gift className="h-3 w-3" />
                          {user.isOnFreeTrial ? "Deneme Aktif" : "Aktif"}
                        </span>
                      ) : user.status === "pending" ? (
                        <span className="badge-warning">Onay Bekliyor</span>
                      ) : (
                        <span className="badge-danger">
                          <UserX className="h-3 w-3" />
                          Erişim Yok
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {user.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() => saveUser(user.id)}
                          disabled={savingId === user.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-bridge-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-bridge-500 disabled:opacity-60"
                        >
                          {savingId === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Kaydet
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
