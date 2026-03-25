import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, NavLink, useLocation } from 'react-router-dom'
import './App.css'

type Skill = {
  id: number
  name: string
  level: number
}

type Education = {
  id: number
  degree: string
  school: string
  year: string
  note: string
}

type DraftState = {
  profile: {
    name: string
    title: string
    location: string
    status: string
    bio: string
  }
  skills: Skill[]
  education: Education[]
  activeSection: 'profile' | 'skills' | 'education'
  lastSavedAt: string | null
  lastPublishedAt: string | null
}

type Section = 'profile' | 'skills' | 'education'

type SectionMeta = {
  title: string
  subtitle: string
  navLabel: string
  navHint: string
}

const draftStorageKey = 'mahialamazad-admin-draft'

const sectionMeta: Record<Section, SectionMeta> = {
  profile: {
    title: 'Identity and positioning',
    subtitle: 'Edit the public bio, headline, and location details that frame the portfolio.',
    navLabel: 'Profile',
    navHint: 'Edit identity and introduction',
  },
  skills: {
    title: 'Skill list and strength',
    subtitle: 'Adjust the portfolio skills mix and set the confidence level for each item.',
    navLabel: 'Skills',
    navHint: 'Adjust priorities and proficiency',
  },
  education: {
    title: 'Learning timeline',
    subtitle: 'Keep the education timeline concise, current, and presentation-ready.',
    navLabel: 'Education',
    navHint: 'Maintain the portfolio timeline',
  },
}

const initialSkills: Skill[] = [
  { id: 1, name: 'Brand identity', level: 92 },
  { id: 2, name: 'UI systems', level: 84 },
  { id: 3, name: 'Figma workflows', level: 88 },
  { id: 4, name: 'Content strategy', level: 76 },
]

const initialEducation: Education[] = [
  {
    id: 1,
    degree: 'B.Des. Visual Communication',
    school: 'University of the Arts',
    year: '2020 - 2024',
    note: 'Focused on portfolio storytelling, editorial systems, and motion-ready layouts.',
  },
  {
    id: 2,
    degree: 'Design Foundation Certificate',
    school: 'Creative Lab',
    year: '2019',
    note: 'Built the core visual language used across personal and client projects.',
  },
]

const defaultDraft: DraftState = {
  profile: {
    name: 'Mahi Alam Azad',
    title: 'Portfolio Designer & Creative Technologist',
    location: 'Dhaka, Bangladesh',
    status: 'Available for portfolio refreshes and landing page builds',
    bio: 'A clean admin demo for editing profile details, shaping skills, and updating education content before publishing the public portfolio.',
  },
  skills: initialSkills,
  education: initialEducation,
  activeSection: 'profile',
  lastSavedAt: null,
  lastPublishedAt: null,
}

const getSectionFromPath = (pathname: string): Section | null => {
  const normalizedPath = pathname.replace(/^\/+/, '')
  const sectionName = normalizedPath.split('/')[0]

  if (sectionName === 'profile' || sectionName === 'skills' || sectionName === 'education') {
    return sectionName
  }

  return null
}

const getStoredSection = (): Section => {
  try {
    const rawDraft = window.localStorage.getItem(draftStorageKey)

    if (!rawDraft) {
      return 'profile'
    }

    const parsedDraft = JSON.parse(rawDraft) as Partial<DraftState>

    if (
      parsedDraft.activeSection === 'profile' ||
      parsedDraft.activeSection === 'skills' ||
      parsedDraft.activeSection === 'education'
    ) {
      return parsedDraft.activeSection
    }
  } catch {
    // Ignore malformed drafts and fall back to the default route.
  }

  return 'profile'
}

const formatTimestamp = (value: string | null) => {
  if (!value) {
    return 'Not saved yet'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function App() {
  const location = useLocation()
  const currentSection = getSectionFromPath(location.pathname)
  const resolvedSection = currentSection ?? getStoredSection()
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'published'>('idle')
  const [profile, setProfile] = useState(defaultDraft.profile)
  const [skills, setSkills] = useState(defaultDraft.skills)
  const [education, setEducation] = useState(defaultDraft.education)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null)
  const skipAutosaveStatus = useRef(false)

  useEffect(() => {
    const rawDraft = window.localStorage.getItem(draftStorageKey)

    if (!rawDraft) {
      setDraftLoaded(true)
      return
    }

    try {
      const parsedDraft = JSON.parse(rawDraft) as Partial<DraftState>

      setProfile(parsedDraft.profile ?? defaultDraft.profile)
      setSkills(parsedDraft.skills ?? defaultDraft.skills)
      setEducation(parsedDraft.education ?? defaultDraft.education)
      setLastSavedAt(parsedDraft.lastSavedAt ?? null)
      setLastPublishedAt(parsedDraft.lastPublishedAt ?? null)
      setSaveState(
        parsedDraft.lastPublishedAt ? 'published' : parsedDraft.lastSavedAt ? 'saved' : 'idle',
      )
    } catch {
      window.localStorage.removeItem(draftStorageKey)
    } finally {
      setDraftLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!draftLoaded) {
      return
    }

    const nextLastSavedAt = new Date().toISOString()

    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        profile,
        skills,
        education,
        activeSection: resolvedSection,
        lastSavedAt: nextLastSavedAt,
        lastPublishedAt,
      }),
    )
    setLastSavedAt(nextLastSavedAt)
    if (skipAutosaveStatus.current) {
      skipAutosaveStatus.current = false
      return
    }

    setSaveState('saved')
  }, [draftLoaded, education, lastPublishedAt, profile, resolvedSection, skills])

  const averageSkill = useMemo(() => {
    if (!skills.length) {
      return 0
    }

    const total = skills.reduce((sum, skill) => sum + skill.level, 0)
    return Math.round(total / skills.length)
  }, [skills])

  const highlightedSkill = useMemo(() => {
    if (!skills.length) {
      return null
    }

    return [...skills].sort((a, b) => b.level - a.level)[0]
  }, [skills])

  const statusMessage = useMemo(() => {
    if (saveState === 'published') {
      return 'Draft published to the demo timeline.'
    }

    if (saveState === 'saving') {
      return 'Saving draft...'
    }

    if (saveState === 'saved') {
      return 'Draft saved locally.'
    }

    return 'Changes stay local until you publish.'
  }, [saveState])

  const persistDraft = (nextPublishAt: string | null = lastPublishedAt) => {
    if (!draftLoaded) {
      return
    }

    const nextSavedAt = new Date().toISOString()

    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        profile,
        skills,
        education,
        activeSection: resolvedSection,
        lastSavedAt: nextSavedAt,
        lastPublishedAt: nextPublishAt,
      }),
    )

    setLastSavedAt(nextSavedAt)
    setSaveState(nextPublishAt ? 'published' : 'saved')
  }

  const handleSaveDraft = () => {
    setSaveState('saving')
    window.setTimeout(() => {
      persistDraft(lastPublishedAt)
    }, 350)
  }

  const handlePublishDraft = () => {
    setSaveState('saving')
    window.setTimeout(() => {
      const nextPublishedAt = new Date().toISOString()
      skipAutosaveStatus.current = true
      persistDraft(nextPublishedAt)
      setLastPublishedAt(nextPublishedAt)
    }, 500)
  }

  const markDirty = () => {
    setSaveState('idle')
  }

  const addSkill = () => {
    const nextId = skills.length ? Math.max(...skills.map((skill) => skill.id)) + 1 : 1
    setSkills([...skills, { id: nextId, name: 'New skill', level: 70 }])
    markDirty()
  }

  const updateSkill = (id: number, field: keyof Skill, value: string | number) => {
    setSkills(
      skills.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill,
      ),
    )
  }

  const removeSkill = (id: number) => {
    setSkills(skills.filter((skill) => skill.id !== id))
    markDirty()
  }

  const addEducation = () => {
    const nextId = education.length ? Math.max(...education.map((item) => item.id)) + 1 : 1
    setEducation([
      ...education,
      {
        id: nextId,
        degree: 'New qualification',
        school: 'Institution name',
        year: '2024',
        note: 'Add a short description of the study focus or credential.',
      },
    ])
    markDirty()
  }

  const updateEducation = (id: number, field: keyof Education, value: string) => {
    setEducation(
      education.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const removeEducation = (id: number) => {
    setEducation(education.filter((item) => item.id !== id))
    markDirty()
  }

  if (!currentSection) {
    return <Navigate replace to={`/${resolvedSection}`} />
  }

  return (
    <main className="admin-app">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <aside className="sidebar">
        <div className="brand-card">
          <p className="eyebrow">Admin Panel</p>
          <h1>Portfolio editor demo</h1>
          <p className="muted">
            A polished frontend concept for admin.mahialamazad.com with live editing for
            profile, skills, and education.
          </p>
        </div>

        <nav className="nav-card" aria-label="Editor sections">
          {(Object.keys(sectionMeta) as Section[]).map((section) => (
            <NavLink
              key={section}
              to={`/${section}`}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {sectionMeta[section].navLabel}
              <span>{sectionMeta[section].navHint}</span>
            </NavLink>
          ))}
        </nav>

        <section className="sidebar-stats card">
          <div>
            <p className="label">Public status</p>
            <strong>{statusMessage}</strong>
          </div>
          <div>
            <p className="label">Skill average</p>
            <strong>{averageSkill}%</strong>
          </div>
          <div>
            <p className="label">Top skill</p>
            <strong>{highlightedSkill ? highlightedSkill.name : 'Add your first skill'}</strong>
          </div>
          <div>
            <p className="label">Last saved</p>
            <strong>{formatTimestamp(lastSavedAt)}</strong>
          </div>
          <div>
            <p className="label">Last published</p>
            <strong>{formatTimestamp(lastPublishedAt)}</strong>
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar card">
          <div>
            <p className="eyebrow">Live preview</p>
            <h2>{sectionMeta[currentSection].title}</h2>
            <p className="muted">{sectionMeta[currentSection].subtitle}</p>
            <div className="route-pill-row">
              <span className="pill accent">/{currentSection}</span>
              <span className="pill">SPA sub-route</span>
            </div>
            <p className="muted">{statusMessage}</p>
          </div>
          <div className="topbar-actions">
            <button type="button" className="ghost-button" onClick={handleSaveDraft}>
              Save draft
            </button>
            <button type="button" className="primary-button" onClick={handlePublishDraft}>
              Publish draft
            </button>
          </div>
        </header>

        <div className="content-grid">
          <section className="editor-stack">
            {currentSection === 'profile' && (
              <article className="editor-card card focus">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">Profile</p>
                    <h3>{sectionMeta.profile.title}</h3>
                  </div>
                  <span className="pill">Core</span>
                </div>

                <label>
                  Display name
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(event) => {
                      setProfile({ ...profile, name: event.target.value })
                      markDirty()
                    }}
                  />
                </label>
                <label>
                  Headline
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(event) => {
                      setProfile({ ...profile, title: event.target.value })
                      markDirty()
                    }}
                  />
                </label>
                <div className="two-column-fields">
                  <label>
                    Location
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(event) => {
                        setProfile({ ...profile, location: event.target.value })
                        markDirty()
                      }}
                    />
                  </label>
                  <label>
                    Availability
                    <input
                      type="text"
                      value={profile.status}
                      onChange={(event) => {
                        setProfile({ ...profile, status: event.target.value })
                        markDirty()
                      }}
                    />
                  </label>
                </div>
                <label>
                  Bio
                  <textarea
                    rows={5}
                    value={profile.bio}
                    onChange={(event) => {
                      setProfile({ ...profile, bio: event.target.value })
                      markDirty()
                    }}
                  />
                </label>
              </article>
            )}

            {currentSection === 'skills' && (
              <article className="editor-card card focus">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">Skills</p>
                    <h3>{sectionMeta.skills.title}</h3>
                  </div>
                  <button type="button" className="ghost-button" onClick={addSkill}>
                    Add skill
                  </button>
                </div>

                <div className="repeat-list">
                  {skills.map((skill) => (
                    <div key={skill.id} className="repeat-item">
                      <div className="repeat-top">
                        <label>
                          Skill name
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(event) => {
                              updateSkill(skill.id, 'name', event.target.value)
                              markDirty()
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => removeSkill(skill.id)}
                        >
                          Remove
                        </button>
                      </div>
                      <label>
                        Proficiency {skill.level}%
                        <input
                          type="range"
                          min={30}
                          max={100}
                          value={skill.level}
                          onChange={(event) => {
                            updateSkill(skill.id, 'level', Number(event.target.value))
                            markDirty()
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </article>
            )}

            {currentSection === 'education' && (
              <article className="editor-card card focus">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">Education</p>
                    <h3>{sectionMeta.education.title}</h3>
                  </div>
                  <button type="button" className="ghost-button" onClick={addEducation}>
                    Add education
                  </button>
                </div>

                <div className="repeat-list">
                  {education.map((item) => (
                    <div key={item.id} className="repeat-item education-item">
                      <div className="repeat-top">
                        <label>
                          Degree
                          <input
                            type="text"
                            value={item.degree}
                            onChange={(event) => {
                              updateEducation(item.id, 'degree', event.target.value)
                              markDirty()
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => removeEducation(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="two-column-fields">
                        <label>
                          School
                          <input
                            type="text"
                            value={item.school}
                            onChange={(event) => {
                              updateEducation(item.id, 'school', event.target.value)
                              markDirty()
                            }}
                          />
                        </label>
                        <label>
                          Year
                          <input
                            type="text"
                            value={item.year}
                            onChange={(event) => {
                              updateEducation(item.id, 'year', event.target.value)
                              markDirty()
                            }}
                          />
                        </label>
                      </div>
                      <label>
                        Note
                        <textarea
                          rows={4}
                          value={item.note}
                          onChange={(event) => {
                            updateEducation(item.id, 'note', event.target.value)
                            markDirty()
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </section>

          <aside className="preview-panel card">
            <div className="preview-header">
              <p className="eyebrow">Public profile</p>
              <span className="pill accent">Portfolio ready</span>
            </div>

            <div className="profile-card">
              <div className="avatar">MA</div>
              <h3>{profile.name}</h3>
              <p className="profile-title">{profile.title}</p>
              <p className="muted">{profile.location}</p>
              <p className="status-line">{profile.status}</p>
            </div>

            <div className="preview-section">
              <h4>About</h4>
              <p>{profile.bio}</p>
            </div>

            <div className="preview-section">
              <div className="section-row">
                <h4>Skills</h4>
                <span>{skills.length} entries</span>
              </div>
              <div className="skill-bars">
                {skills.length ? (
                  skills.map((skill) => (
                    <div key={skill.id} className="skill-row">
                      <div className="skill-label">
                        <span>{skill.name}</span>
                        <strong>{skill.level}%</strong>
                      </div>
                      <div className="meter">
                        <span style={{ width: `${skill.level}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">Add a skill to populate the public preview.</p>
                )}
              </div>
            </div>

            <div className="preview-section">
              <div className="section-row">
                <h4>Education</h4>
                <span>{education.length} records</span>
              </div>
              <div className="timeline">
                {education.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>{item.degree}</strong>
                      <p>
                        {item.school} · {item.year}
                      </p>
                      <span>{item.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default App
