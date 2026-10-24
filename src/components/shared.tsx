'use client';
import Link from 'next/link';
import { ArrowUpRight, AudioLines, CircleHelp, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import type { HelpState, Scope } from '@/domain/types';
export function Shell({ mentor = false, children }: { mentor?: boolean; children: React.ReactNode }) {
  return <div className="app-shell"><aside className="sidebar"><Link className="brand" href="/w/kivi"><span className="brand-mark"><Layers3 size={23}/></span>unblock<span className="brand-dot">.</span></Link>
    <div className="sidebar-label">YOUR WORKSPACE</div><nav aria-label="Main navigation"><Link className={!mentor ? 'active' : ''} href="/w/kivi"><CircleHelp size={18}/>Workshop help</Link><Link className={mentor ? 'active' : ''} href="/mentor"><ShieldCheck size={18}/>Mentor desk</Link></nav>
    <div className="sidebar-note"><span className="tiny-icon"><Sparkles size={18}/></span><strong>Good questions.<br/>Shared progress.</strong><p>One helpful answer can move a whole room forward.</p><span className="note-rule"/><span className="small">Built with Sarvam AI</span></div>
    <a className="sidebar-footer" href="https://heykivi.ai/" target="_blank" rel="noreferrer">Meet Kivi<ArrowUpRight size={14}/></a></aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Kivi workshop</strong></div><div className="topbar-right"><span className="live-tag"><i/> BUILD SESSION</span><span className="avatar">{mentor ? 'M' : 'YOU'}</span></div></header><main>{children}</main><footer className="page-footer"><span><AudioLines size={14}/> Powered by Sarvam</span><span>Independent workshop companion</span></footer></div></div>;
}
export const stateLabel: Record<HelpState, string> = { needs_mentor: 'Needs a mentor', answer_available: 'Answer available', fix_failed: 'Still stuck', resolved: 'Solved' };
export function StateBadge({ state }: { state: HelpState }) { return <span className={`state-badge ${state}`}><i/>{stateLabel[state]}</span>; }
export function ScopeLabel({ scope }: { scope: Scope }) { return <span className="scope-label">{scope.os.map(s => s === 'macos' ? 'Mac' : s === 'windows' ? 'Windows' : s).join(', ')} · {scope.distribution.join(', ')}{scope.versionPolicy === 'exact' ? ` · ${scope.versions.join(', ')}` : ''}</span>; }
export function ErrorNotice({ error }: { error: string }) { return error ? <div role="alert" className="error-notice">{error}</div> : null; }
export function Empty({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><span className="empty-icon"><CircleHelp size={25}/></span><h3>{title}</h3><p>{detail}</p></div>; }
