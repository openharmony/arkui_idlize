/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef CINTEROP_OHOS_SECURITY_CERT_H
#define CINTEROP_OHOS_SECURITY_CERT_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(cert_CertExtension_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(cert_CertExtension_getFinalizer, KNativePointer)
KOALA_INTEROP_1(cert_CertExtension_getEncoded, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_2(cert_CertExtension_getOidList, KInteropReturnBuffer, KNativePointer, KInt)
KOALA_INTEROP_4(cert_CertExtension_getEntry, KInteropReturnBuffer, KNativePointer, KInt, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(cert_CertExtension_checkCA, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_1(cert_CertExtension_hasUnsupportedCriticalExtension, KBoolean, KNativePointer)
KOALA_INTEROP_DIRECT_0(cert_X500DistinguishedName_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(cert_X500DistinguishedName_getFinalizer, KNativePointer)
KOALA_INTEROP_1(cert_X500DistinguishedName_getName0, KStringPtr, KNativePointer)
KOALA_INTEROP_2(cert_X500DistinguishedName_getName1, KStringPtr, KNativePointer, KInt)
KOALA_INTEROP_2(cert_X500DistinguishedName_getName2, KInteropReturnBuffer, KNativePointer, KStringPtr)
KOALA_INTEROP_1(cert_X500DistinguishedName_getEncoded, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_0(cert_X509Cert_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(cert_X509Cert_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_V4(cert_X509Cert_verify0, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V4(cert_X509Cert_verify1, KNativePointer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(cert_X509Cert_getEncoded0, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_CTX_V3(cert_X509Cert_getEncoded1, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getPublicKey, KNativePointer, KNativePointer)
KOALA_INTEROP_V2(cert_X509Cert_checkValidityWithDate, KNativePointer, KStringPtr)
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getVersion, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getCertSerialNumber, KLong, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getIssuerName0, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_2(cert_X509Cert_getIssuerName1, KStringPtr, KNativePointer, KInt)
KOALA_INTEROP_3(cert_X509Cert_getSubjectName, KInteropReturnBuffer, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(cert_X509Cert_getNotBeforeTime, KStringPtr, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getNotAfterTime, KStringPtr, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getSignature, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getSignatureAlgName, KStringPtr, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getSignatureAlgOid, KStringPtr, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getSignatureAlgParams, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getKeyUsage, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getExtKeyUsage, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getBasicConstraints, KInt, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getSubjectAltNames, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_getIssuerAltNames, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_2(cert_X509Cert_getItem, KInteropReturnBuffer, KNativePointer, KInt)
KOALA_INTEROP_DIRECT_3(cert_X509Cert_match, KBoolean, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_1(cert_X509Cert_getCRLDistributionPoint, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getIssuerX500DistinguishedName, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getSubjectX500DistinguishedName, KNativePointer, KNativePointer)
KOALA_INTEROP_1(cert_X509Cert_toString0, KStringPtr, KNativePointer)
KOALA_INTEROP_2(cert_X509Cert_toString1, KStringPtr, KNativePointer, KInt)
KOALA_INTEROP_1(cert_X509Cert_hashCode, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getExtensionsObject, KNativePointer, KNativePointer)
#endif // CINTEROP_OHOS_SECURITY_CERT_H
