import React, { useEffect, useRef } from 'react';

export default function RichTextEditor({ value, onChange, disabled = false, placeholder = '' }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value != null && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const sanitize = (html) => {
    if (!html) return '';
    let s = html;
    s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    s = s.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    s = s.replace(/\son\w+="[^"]*"/gi, '');
    s = s.replace(/\sstyle="[^"]*"/gi, '');
    s = s.replace(/<([^>\s]+)[^>]*>/g, (m, tag) => {
      const allowed = ['b','strong','i','em','u','p','br','ul','ol','li','a'];
      if (!allowed.includes(tag.toLowerCase())) return '';
      if (tag.toLowerCase() === 'a') {
        const hrefMatch = m.match(/href="([^"]*)"/i);
        const href = hrefMatch ? hrefMatch[1] : '';
        if (!/^https?:\/\//i.test(href)) return '<a>';
        return `<a href="${href}" rel="noopener noreferrer" target="_blank">`;
      }
      return `<${tag}>`;
    });
    return s;
  };

  const exec = (cmd, val = null) => {
    if (disabled) return;
    document.execCommand(cmd, false, val);
    const html = editorRef.current?.innerHTML || '';
    onChange?.(sanitize(html));
  };

  const makeLink = () => {
    const url = window.prompt('Enter URL (https://...)');
    if (!url) return;
    exec('createLink', url);
  };

  const onInput = () => {
    const html = editorRef.current?.innerHTML || '';
    onChange?.(sanitize(html));
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" className="rte-btn" onClick={() => exec('bold')} disabled={disabled}>B</button>
        <button type="button" className="rte-btn" onClick={() => exec('italic')} disabled={disabled}><span style={{fontStyle:'italic'}}>I</span></button>
        <button type="button" className="rte-btn" onClick={() => exec('underline')} disabled={disabled}><span style={{textDecoration:'underline'}}>U</span></button>
        <span className="rte-sep" />
        <button type="button" className="rte-btn" onClick={() => exec('insertUnorderedList')} disabled={disabled}>• List</button>
        <button type="button" className="rte-btn" onClick={() => exec('insertOrderedList')} disabled={disabled}>1. List</button>
        <span className="rte-sep" />
        <button type="button" className="rte-btn" onClick={makeLink} disabled={disabled}>Link</button>
      </div>
      <div
        className="rte-editor form-control"
        contentEditable={!disabled}
        ref={editorRef}
        onInput={onInput}
        data-placeholder={placeholder}
        aria-label="Rich text editor"
      />
    </div>
  );
}

