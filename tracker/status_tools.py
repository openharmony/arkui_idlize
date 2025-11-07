#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
from dataclasses import astuple, dataclass
import json
from collections import namedtuple
import os
import re

JSON_FILE = 'packages-filter.json'
FULL_SDK_STATUS = '../doc/FULL_SDK_STATUS.md'
SDK_STATUS = '../doc/SDK_STATUS.md'
DELETED_SDK_STATUS = '../doc/DELETED_SDK_STATUS.md'
CAPI_STATUS = '../doc/COMPONENTS.md'
CAPI_STATUS_INPUT = '../doc/COMPONENTS_STATUS.md'
TS_STATUS = '../doc/MANAGED.md'
TS_STATUS_INPUT = '../doc/MANAGED_STATUS.md'
FULL_API_STATUS = '../doc/FULL_API_STATUS.md'
HANDWRITTEN = '../doc/NEW_DEV_API_STATUS.md'
HANDWRITTEN_STATUS = '../doc/DEV_API_STATUS.md'

SdkStatus = namedtuple('SdkStatus', ['i','pkg','old_pkg','parent','name','ovr','type','status','source'])
CapiStatus = namedtuple('CapiStatus', ['i','pkg','parent','name','ovr','c_parent','c_name','type','owner','status','test_status','test_version','comment','ii'])
TsStatus = namedtuple('CapiStatus', ['i','pkg','parent','name','ovr','owner','status','test_status','test_version','comment','ii'])

@dataclass
class FullStatus:
    i: str
    pkg: str
    parent: str
    name: str
    ovr: str
    type: str
    status: str
    c_parent: str
    c_name: str
    ts_status: str
    c_status: str
    owner: str
    test_status: str
    test_version: str
    comment: str
    source: str

@dataclass
class HandwrittenStatus:
    i: str
    status: str
    owner: str
    test_status: str
    test_version: str
    comment: str
    pkg: str
    parent: str
    name: str
    ovr: str
    type: str
    c_parent: str
    c_name: str

def GetConfig():
    with open(JSON_FILE) as f:
        return json.load(f)

def ReadSdk(fname=SDK_STATUS):
    sdk = []
    with open(fname, 'r') as f:
        firstLine = True
        for line in f:
            if firstLine:
                firstLine = False
                continue
            cols = line.split('|', 8)
            st = SdkStatus(*map(str.strip, cols))
            sdk.append(st)
    return sdk

def ReadCapi():
    result = []
    with open(CAPI_STATUS, 'r') as f:
        skip = True
        for line in f:
            cols = line.split('|')
            if skip:
                if len(cols) > 10 and cols[1].strip().startswith('-'):
                    skip = False
                continue
            cols[4] = cols[4].strip(' *')
            cols[5] = cols[5].strip(' *`')
            st = CapiStatus(*map(lambda x: x.strip(' '),cols))
            result.append(st)
    return result

def CapiStatusMap(inp):
    if inp.startswith('blocked '):
        return 'blocked'
    match inp:
        case 'testskipped':
            return 'done'
        case '':
            return 'handwritten'
    return inp

def ReadManaged(inp):
    fname = TS_STATUS_INPUT if inp else TS_STATUS
    result = []
    if not os.path.exists(fname):
        return result
    with open(fname, 'r') as f:
        firstLine = True
        for line in f:
            if firstLine:
                firstLine = False
                continue
            cols = line.split('|')
            st = TsStatus(*map(str.strip,cols))
            result.append(st)
    return result

def TsStatusMap(inp):
    return inp if inp != '' else 'handwritten'

def FindStatus(statuses, pkg, parent, name, ovr):
    for s in statuses:
        if s.pkg == pkg and s.parent == parent and s.name == name and s.ovr == ovr:
            return s
    return None

def FindStatusExt(statuses, pkg, parent, name, ovr):
    last = None
    for s in statuses:
        if s.pkg == pkg and s.parent == parent and s.name == name and s.ovr == ovr:
            if last:
                return last, s
            last = s
        elif last:
            return last, None
    return None, None

def PrintStatus(f, s):
    def add_space(s):
        return f' {s} '
    r = map(add_space, s)
    f.write('|'.join(r).strip())
    f.write('\n')

def inpkg(s, packages):
    for pkg in packages:
        if s.startswith(pkg):
            return True
    return False

def Split():
    sdk = ReadSdk()
    capi = ReadCapi()
    old = ReadManaged(True)
    ms = []
    config = GetConfig()
    managed = config['managed']
    for s in sdk:
        if not inpkg(s.pkg, managed):
            continue
        res = FindStatus(capi, s.pkg, s.parent, s.name, s.ovr)
        if not res:
            ms.append(s)
    with open(TS_STATUS, 'w') as f:
        f.write(f'| Package | Parent | Name | Ovr | Owner | Status | Test status | Test version | Comment |\n')
        for s in ms:
            res = FindStatus(old, s.pkg, s.parent, s.name, s.ovr)
            if res:
                PrintStatus(f, res)
            else:
                f.write(f'| {s.pkg} | {s.parent} | {s.name} | {s.ovr} |  | {s.status} |  |  |  |\n')

def ReadHandwritten(fname):
    result = []
    if not os.path.exists(fname):
        return result
    with open(fname, 'r') as f:
        skip = True
        for line in f:
            cols = line.split('|')
            if skip:
                if len(cols) > 9 and cols[1].strip().startswith('-'):
                    skip = False
                continue
            st = HandwrittenStatus(*map(str.strip,cols))
            result.append(st)
    return result

def Handwritten():
    sdk = ReadSdk()
    capi = ReadCapi()
    old = ReadHandwritten(HANDWRITTEN_STATUS)
    config = GetConfig()
    managed = config['managed']
    result = []
    for s in sdk:
        if not inpkg(s.pkg, managed):
            continue
        os = FindStatus(old, s.pkg, s.parent, s.name, s.ovr)
        if os:
            if os.status.strip() == '':
                os.status = 'backlog'
            result.append(os)
            continue
        cs, ps = FindStatusExt(capi, s.pkg, s.parent, s.name, s.ovr)
        if cs:
            if cs.status in ['generated', 'deleted']:
                continue
            if cs.status.startswith('deleted'):
                continue
            ns = cs.status
            if ns == '':
                ns = 'backlog'
            if ns == 'testskipped':
                ns = 'done'
            pss = ''
            if ps:
                pss = ps.status if ps.status else 'backlog'
            def mrg(l, r):
                return l if l == r else f'{l}/{r}'
            os = HandwrittenStatus('',
                pkg = s.pkg,
                parent = s.parent,
                name = s.name,
                ovr = s.ovr,
                type = s.type,
                c_parent = cs.c_parent,
                c_name = mrg(cs.c_name, ps.c_name) if ps else cs.c_name,
                owner = mrg(cs.owner, ps.owner) if ps else cs.owner,
                status = mrg(ns, pss) if ps else ns,
                test_status = cs.test_status,
                test_version = cs.test_version,
                comment = mrg(cs.comment, ps.comment) if ps else cs.comment)
            result.append(os)
            continue
        if s.type in ['interface', 'field', 'enum_class', 'enum_instance', 'namespace']:
            continue
        os = HandwrittenStatus('',
            pkg = s.pkg,
            parent = s.parent,
            name = s.name,
            ovr = s.ovr,
            type = s.type,
            c_parent = '',
            c_name = '',
            owner = '',
            status = 'backlog',
            test_status = '',
            test_version = '',
            comment = '')
        result.append(os)
    stats = {}
    snames = set()
    for s in result:
        if not(s.type in stats):
            stats[s.type] = {}
        r = stats[s.type]
        st = s.status
        if not(st in r):
            r[st] = 0
        r[st] += 1
        snames.add(st)
    with open(HANDWRITTEN, 'w') as f:
        sw = max(map(lambda x: len(x), snames))
        v = 'Status'
        f.write(f'| {v:{sw}} | ' + (' | '.join(stats.keys())) + ' | Total |\n')
        v = '-' * sw
        sep = f'| {v} | ' + (' | '.join(map(lambda x: '-' * len(x), stats.keys()))) + f' | ----- |\n'
        f.write(sep)
        total = 0
        for s in sorted(snames):
            tot = sum([stats[x].get(s, 0) for x in stats.keys()])
            total += tot
            f.write(f'| {s:{sw}} | ' + (' | '.join(map(lambda x: f'{stats[x].get(s, 0):{len(x)}}', stats.keys()))) + f' | {tot:5} |\n')
        f.write(sep)
        v = 'Total'
        f.write(f'| {v:{sw}} | ' + (' | '.join(map(lambda x: f'{sum(stats[x].values()):{len(x)}}', stats.keys()))) + f' | {total:5} |\n')

        f.write('\n')
        f.write(f'| Item Status | Owner | Last test status | Last test version | Comments | Package | SDK Parent | SDK Name | Override | Type | C API Parent | C API Name |\n')
        f.write(f'| ----------- | ----- | ---------------- | ----------------- | -------- | ------- | ---------- | -------- | -------- | ---- | ------------ | ---------- |\n')
        for s in result:
            PrintStatus(f, astuple(s))

# Filter full SDK status to ArkUI SDK status
def PrepareSdk():
    config = GetConfig()

    include = config['include']
    exclude = config['exclude']

    with open(SDK_STATUS, 'w') as fo:
        res = []
        with open(FULL_SDK_STATUS) as fi:
            fo.write(fi.readline())
            for line in fi:
                pkg = line.split('|')[1].strip()
                if inpkg(pkg, include) and not inpkg(pkg, exclude):
                    res.append(line)
        fo.write(''.join(sorted(res, key=lambda x: x.split('|')[1].strip())))
#        # Append deleted packages
#        deleted = ReadSdk(DELETED_SDK_STATUS)
#        for i in deleted:
#            r = list(i)
#            r[7] = 'Deleted package'
#            PrintStatus(fo, r)

def MakeCapiStatus():
    with open(CAPI_STATUS_INPUT, 'w') as fo:
        fo.write('| Parent | Item | Type | Owner | Status | Test status | Test version | Comment/Issue |\n')
        fo.write('| ------ | ---- | ---- | ----- | ------ | ----------- | ------------ | ------------- |\n')
        with open(CAPI_STATUS) as fi:
            skip = True
            for line in fi:
                cols = line.split('|')
                if skip:
                    if len(cols) > 10 and cols[1].strip().startswith('-'):
                        skip = False
                    continue
                if cols[9].strip() in ['automatic', 'generated']:
                    continue
                out = '|'.join(cols[5:])
                fo.write('|' + out)

def PostprocessStatus(inp):
    if inp.type in ['interface', 'enum_class', 'class', 'namespace']:
        inp.parent = inp.name if inp.parent == 'unnamed' else f'{inp.parent}.{inp.name}'

def GenerateFullStatus():
    sdk = ReadSdk()
    capi = ReadCapi()
    managed = ReadManaged(False)
    def fstatus(st):
        known = ['done','backlog','in progress','overload','blocked','out of scope']
        for k in known:
            if st.startswith(k):
                return k
        return st
    def common_status(cs, ts):
        if ts != 'generated':
            return fstatus(ts) if ts != 'handwritten' else 'backlog'
        if cs in ['generated', 'TS only', 'deleted']:
            return 'done'
        return fstatus(cs) if cs != 'handwritten' else 'backlog'
    with open(FULL_API_STATUS, 'w') as f:
        f.write(f'| Package | SDK Parent | SDK Name | Override | Type | Item Status | C API Parent | C API Name | TS Status | C API Status | Owner | Last test status | Last test version | Comments | Declaration |\n')
        def print_status(cs, ts, ps):
            init = [''] * 16
            res = FullStatus(*init)
            res.pkg = s.pkg
            res.parent = s.parent
            res.name = s.name
            res.ovr = s.ovr
            res.type = s.type
            res.source = s.source
            if cs and not ts:
                c_status = CapiStatusMap(cs.status)
                ts_status = 'generated'
                res.c_parent = cs.c_parent
                res.c_name = cs.c_name
                res.owner = cs.owner
                res.test_status = cs.test_status
                res.test_version = cs.test_version
                res.comment = cs.comment
                if ps:
                    def mrg(l, r):
                        return l if l == r else f'{l}/{r}'
                    c_status = mrg(c_status, CapiStatusMap(ps.status))
                    res.c_name = mrg(res.c_name, ps.c_name)
                    res.owner = mrg(res.owner, ps.owner)
                    res.test_status = mrg(res.test_status, ps.test_status)
                    res.test_version = mrg(res.test_version, ps.test_version)
                    res.comment = mrg(res.comment, ps.comment)
            elif ts and not cs:
                c_status = 'TS only'
                ts_status = TsStatusMap(ts.status)
                res.owner = ts.owner
                res.test_status = ts.test_status
                res.test_version = ts.test_version
                res.comment = ts.comment
            elif ts and cs:
                c_status = CapiStatusMap(cs.status)
                ts_status = TsStatusMap(ts.status)
                res.c_parent = cs.c_parent
                res.c_name = cs.c_name
                res.owner = f'{cs.owner}/{ts.owner}'
                res.test_status = f'{cs.test_status}/{ts.test_status}'
                res.test_version = f'{cs.test_version}/{ts.test_version}'
                res.comment = f'{cs.comment}/{ts.comment}'
            else:
                c_status = 'deleted external'
                ts_status = 'deleted external'
            res.status = common_status(c_status, ts_status)
            res.c_status = c_status
            res.ts_status = ts_status
            PostprocessStatus(res)
            PrintStatus(f, astuple(res))
        for s in sdk:
            cs, ps = FindStatusExt(capi, s.pkg, s.parent, s.name, s.ovr)
            ts = FindStatus(managed, s.pkg, s.parent, s.name, s.ovr)
            print_status(cs, ts, ps)

def GenerateFullStatusNew():
    sdk = ReadSdk()
    capi = ReadCapi()
    status = ReadHandwritten(HANDWRITTEN)
    config = GetConfig()
    managed = config['managed']
    with open(FULL_API_STATUS, 'w') as f:
        f.write(f'| Package | SDK Parent | SDK Name | Override | Type | Item Status | C API Parent | C API Name | TS Status | C API Status | Owner | Last test status | Last test version | Comments | Declaration |\n')
        for s in sdk:
            empty_status = 'deleted unused' if inpkg(s.pkg, managed) else 'deleted external'
            st = FindStatus(status, s.pkg, s.parent, s.name, s.ovr)
            cs = FindStatus(capi, s.pkg, s.parent, s.name, s.ovr)
            if st is None:
                st = cs
            def cnv_status(status):
                match status:
                    case 'generated':
                        return 'done'
                    case '':
                        return 'backlog'
                return status
            ts_status = empty_status
            c_status = empty_status
            if cs:
                ts_status = 'generated'
                c_status = cs.status
                if c_status != 'generated' and not(c_status.startswith('deleted')):
                    c_status = 'handwritten'
            elif st:
                ts_status = 'handwritten'
                c_status = 'TS only'
            res = FullStatus('',
                pkg = s.pkg,
                parent = s.parent,
                name = s.name,
                ovr = s.ovr,
                type = s.type,
                source = s.source,
                status = cnv_status(st.status) if st else empty_status,
                c_parent = st.c_parent if st else '',
                c_name = st.c_name if st else '',
                ts_status = ts_status,
                c_status = c_status,
                owner = st.owner if st else '',
                test_status = st.test_status if st else '',
                test_version = st.test_version if st else '',
                comment = st.comment if st else '')
            PostprocessStatus(res)
            PrintStatus(f, astuple(res))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command')
    args = parser.parse_args()
    match args.command:
        case 'prepare':
            PrepareSdk()
        case 'handwritten':
            Handwritten()
        case 'generate':
            GenerateFullStatusNew()
        case 'all':
            print('Generating Full API status...')
            PrepareSdk()
            Handwritten()
            GenerateFullStatusNew()
            print('Done.')
        case 'old':
            PrepareSdk()
            Split()
            GenerateFullStatus()
        case _:
            print('Invalid command!')

if __name__ == "__main__":
    main()
