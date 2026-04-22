import { promises as fs } from "fs"
import path from "path"
import {
  createEmptySocietyConfig,
  DEFAULT_SOCIETY_CONFIG,
  DEFAULT_SOCIETY_ID,
  slugifySocietyId,
} from "@/lib/society-config"
import { SocietyConfig, SocietyConfigStore, SocietySummary } from "@/types"

const configPath = path.join(process.cwd(), "data", "society-config.json")

interface LegacySocietyConfig extends SocietyConfig {
  id?: string
}

interface StoredSocietyConfigFile {
  defaultSocietyId?: string
  societies?: SocietySummary[]
}

function normalizeSocietyConfig(config?: Partial<SocietyConfig>): SocietyConfig {
  return {
    ...createEmptySocietyConfig(),
    ...DEFAULT_SOCIETY_CONFIG,
    ...config,
    governingBody: Array.isArray(config?.governingBody)
      ? config!.governingBody.map((member) => ({
          role: member?.role || "",
          name: member?.name || "",
        }))
      : DEFAULT_SOCIETY_CONFIG.governingBody,
    executiveMembers: Array.isArray(config?.executiveMembers)
      ? config!.executiveMembers.map((member) => member || "")
      : DEFAULT_SOCIETY_CONFIG.executiveMembers,
  }
}

function normalizeLegacyConfig(payload: LegacySocietyConfig): SocietyConfigStore {
  const id = slugifySocietyId(payload.id || payload.name || DEFAULT_SOCIETY_ID)
  return {
    defaultSocietyId: id,
    societies: [
      {
        id,
        ...normalizeSocietyConfig(payload),
      },
    ],
  }
}

function normalizeStore(payload: StoredSocietyConfigFile): SocietyConfigStore {
  const societies = Array.isArray(payload.societies)
    ? payload.societies.map((society) => ({
        id: slugifySocietyId(society.id || society.name),
        ...normalizeSocietyConfig(society),
      }))
    : []

  if (societies.length === 0) {
    return normalizeLegacyConfig(DEFAULT_SOCIETY_CONFIG)
  }

  const defaultSocietyId = societies.some((society) => society.id === payload.defaultSocietyId)
    ? (payload.defaultSocietyId as string)
    : societies[0].id

  return {
    defaultSocietyId,
    societies,
  }
}

async function readRawConfigFile(): Promise<StoredSocietyConfigFile | LegacySocietyConfig | null> {
  try {
    const raw = await fs.readFile(configPath, "utf-8")
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function getSocietyConfigStore(): Promise<SocietyConfigStore> {
  const raw = await readRawConfigFile()
  if (!raw) {
    return normalizeLegacyConfig(DEFAULT_SOCIETY_CONFIG)
  }

  if (Array.isArray((raw as StoredSocietyConfigFile).societies)) {
    return normalizeStore(raw as StoredSocietyConfigFile)
  }

  return normalizeLegacyConfig(raw as LegacySocietyConfig)
}

export async function saveSocietyConfigStore(store: SocietyConfigStore): Promise<void> {
  const normalized = normalizeStore(store)
  await fs.writeFile(configPath, JSON.stringify(normalized, null, 2), "utf-8")
}

export async function upsertSocietyConfig(
  society: SocietySummary,
  options?: { makeDefault?: boolean }
): Promise<SocietyConfigStore> {
  const store = await getSocietyConfigStore()
  const normalizedSociety = {
    id: slugifySocietyId(society.id || society.name),
    ...normalizeSocietyConfig(society),
  }

  const existingIndex = store.societies.findIndex((item) => item.id === normalizedSociety.id)
  if (existingIndex >= 0) {
    store.societies[existingIndex] = normalizedSociety
  } else {
    store.societies.push(normalizedSociety)
  }

  if (options?.makeDefault || !store.defaultSocietyId) {
    store.defaultSocietyId = normalizedSociety.id
  }

  await saveSocietyConfigStore(store)
  return store
}

export async function getSocietyById(id?: string): Promise<SocietySummary> {
  const store = await getSocietyConfigStore()
  const society =
    store.societies.find((item) => item.id === id) ||
    store.societies.find((item) => item.id === store.defaultSocietyId) ||
    store.societies[0]

  return society
}
