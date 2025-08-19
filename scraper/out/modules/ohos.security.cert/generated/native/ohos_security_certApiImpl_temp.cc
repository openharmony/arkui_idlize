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

#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule
#include "common-interop.h"
#include "ohos_security_cert.h"

OH_Int32 cert_CertExtension_checkCAImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_CertExtensionHandle cert_CertExtension_constructImpl();
void cert_CertExtension_destructImpl(OH_OHOS_SECURITY_CERT_cert_CertExtensionHandle thisPtr);
OH_OHOS_SECURITY_CERT_cert_EncodingBlob cert_CertExtension_getEncodedImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataBlob cert_CertExtension_getEntryImpl(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_ExtensionEntryType valueType, const OH_OHOS_SECURITY_CERT_cert_DataBlob* oid);
OH_OHOS_SECURITY_CERT_cert_DataArray cert_CertExtension_getOidListImpl(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_ExtensionOidType valueType);
OH_Boolean cert_CertExtension_hasUnsupportedCriticalExtensionImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameHandle cert_X500DistinguishedName_constructImpl();
void cert_X500DistinguishedName_destructImpl(OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameHandle thisPtr);
OH_OHOS_SECURITY_CERT_cert_EncodingBlob cert_X500DistinguishedName_getEncodedImpl(OH_NativePointer thisPtr);
OH_String cert_X500DistinguishedName_getName0Impl(OH_NativePointer thisPtr);
OH_String cert_X500DistinguishedName_getName1Impl(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_EncodingType encodingType);
Array_String cert_X500DistinguishedName_getName2Impl(OH_NativePointer thisPtr, const OH_String* type);
void cert_X509Cert_checkValidityWithDateImpl(OH_NativePointer thisPtr, const OH_String* date);
OH_OHOS_SECURITY_CERT_cert_X509CertHandle cert_X509Cert_constructImpl();
void cert_X509Cert_destructImpl(OH_OHOS_SECURITY_CERT_cert_X509CertHandle thisPtr);
OH_Int32 cert_X509Cert_getBasicConstraintsImpl(OH_NativePointer thisPtr);
OH_Int64 cert_X509Cert_getCertSerialNumberImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataArray cert_X509Cert_getCRLDistributionPointImpl(OH_NativePointer thisPtr);
void cert_X509Cert_getEncoded0Impl(OH_NativePointer thisPtr, const OHOS_SECURITY_CERT_AsyncCallback* callback_);
void cert_X509Cert_getEncoded1Impl(OH_OHOS_SECURITY_CERT_VMContext vmContext, OH_OHOS_SECURITY_CERT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void* outputArgumentForReturningPromise);
OH_OHOS_SECURITY_CERT_cert_CertExtension cert_X509Cert_getExtensionsObjectImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataArray cert_X509Cert_getExtKeyUsageImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataArray cert_X509Cert_getIssuerAltNamesImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataBlob cert_X509Cert_getIssuerName0Impl(OH_NativePointer thisPtr);
OH_String cert_X509Cert_getIssuerName1Impl(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_EncodingType encodingType);
OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName cert_X509Cert_getIssuerX500DistinguishedNameImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataBlob cert_X509Cert_getItemImpl(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_CertItemType itemType);
OH_OHOS_SECURITY_CERT_cert_DataBlob cert_X509Cert_getKeyUsageImpl(OH_NativePointer thisPtr);
OH_String cert_X509Cert_getNotAfterTimeImpl(OH_NativePointer thisPtr);
OH_String cert_X509Cert_getNotBeforeTimeImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey cert_X509Cert_getPublicKeyImpl(OH_NativePointer thisPtr);
OH_String cert_X509Cert_getSignatureAlgNameImpl(OH_NativePointer thisPtr);
OH_String cert_X509Cert_getSignatureAlgOidImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataBlob cert_X509Cert_getSignatureAlgParamsImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataBlob cert_X509Cert_getSignatureImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataArray cert_X509Cert_getSubjectAltNamesImpl(OH_NativePointer thisPtr);
OH_OHOS_SECURITY_CERT_cert_DataBlob cert_X509Cert_getSubjectNameImpl(OH_NativePointer thisPtr, const Opt_cert_EncodingType* encodingType);
OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName cert_X509Cert_getSubjectX500DistinguishedNameImpl(OH_NativePointer thisPtr);
OH_Int32 cert_X509Cert_getVersionImpl(OH_NativePointer thisPtr);
OH_Buffer cert_X509Cert_hashCodeImpl(OH_NativePointer thisPtr);
OH_Boolean cert_X509Cert_matchImpl(OH_NativePointer thisPtr, const OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters* param);
OH_String cert_X509Cert_toString0Impl(OH_NativePointer thisPtr);
OH_String cert_X509Cert_toString1Impl(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_EncodingType encodingType);
void cert_X509Cert_verify0Impl(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey key, const OHOS_SECURITY_CERT_AsyncCallback* callback_);
void cert_X509Cert_verify1Impl(OH_OHOS_SECURITY_CERT_VMContext vmContext, OH_OHOS_SECURITY_CERT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey key, const OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
const OH_OHOS_SECURITY_CERT_cert_CertExtensionModifier* OH_OHOS_SECURITY_CERT_cert_CertExtensionModifierImpl() {
    const static OH_OHOS_SECURITY_CERT_cert_CertExtensionModifier instance = {
        &cert_CertExtension_constructImpl,
        &cert_CertExtension_destructImpl,
        &cert_CertExtension_getEncodedImpl,
        &cert_CertExtension_getOidListImpl,
        &cert_CertExtension_getEntryImpl,
        &cert_CertExtension_checkCAImpl,
        &cert_CertExtension_hasUnsupportedCriticalExtensionImpl,
    };
    return &instance;
}
const OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameModifier* OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameModifierImpl() {
    const static OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameModifier instance = {
        &cert_X500DistinguishedName_constructImpl,
        &cert_X500DistinguishedName_destructImpl,
        &cert_X500DistinguishedName_getName0Impl,
        &cert_X500DistinguishedName_getName1Impl,
        &cert_X500DistinguishedName_getName2Impl,
        &cert_X500DistinguishedName_getEncodedImpl,
    };
    return &instance;
}
const OH_OHOS_SECURITY_CERT_cert_X509CertModifier* OH_OHOS_SECURITY_CERT_cert_X509CertModifierImpl() {
    const static OH_OHOS_SECURITY_CERT_cert_X509CertModifier instance = {
        &cert_X509Cert_constructImpl,
        &cert_X509Cert_destructImpl,
        &cert_X509Cert_verify0Impl,
        &cert_X509Cert_verify1Impl,
        &cert_X509Cert_getEncoded0Impl,
        &cert_X509Cert_getEncoded1Impl,
        &cert_X509Cert_getPublicKeyImpl,
        &cert_X509Cert_checkValidityWithDateImpl,
        &cert_X509Cert_getVersionImpl,
        &cert_X509Cert_getCertSerialNumberImpl,
        &cert_X509Cert_getIssuerName0Impl,
        &cert_X509Cert_getIssuerName1Impl,
        &cert_X509Cert_getSubjectNameImpl,
        &cert_X509Cert_getNotBeforeTimeImpl,
        &cert_X509Cert_getNotAfterTimeImpl,
        &cert_X509Cert_getSignatureImpl,
        &cert_X509Cert_getSignatureAlgNameImpl,
        &cert_X509Cert_getSignatureAlgOidImpl,
        &cert_X509Cert_getSignatureAlgParamsImpl,
        &cert_X509Cert_getKeyUsageImpl,
        &cert_X509Cert_getExtKeyUsageImpl,
        &cert_X509Cert_getBasicConstraintsImpl,
        &cert_X509Cert_getSubjectAltNamesImpl,
        &cert_X509Cert_getIssuerAltNamesImpl,
        &cert_X509Cert_getItemImpl,
        &cert_X509Cert_matchImpl,
        &cert_X509Cert_getCRLDistributionPointImpl,
        &cert_X509Cert_getIssuerX500DistinguishedNameImpl,
        &cert_X509Cert_getSubjectX500DistinguishedNameImpl,
        &cert_X509Cert_toString0Impl,
        &cert_X509Cert_toString1Impl,
        &cert_X509Cert_hashCodeImpl,
        &cert_X509Cert_getExtensionsObjectImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_SECURITY_CERT_API* GetOHOS_SECURITY_CERTAPIImpl(int version) {
    const static OH_OHOS_SECURITY_CERT_API api = {
        1, // version
        &OH_OHOS_SECURITY_CERT_cert_CertExtensionModifierImpl,
        &OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameModifierImpl,
        &OH_OHOS_SECURITY_CERT_cert_X509CertModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_SECURITY_CERT_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_SECURITY_CERTAPIImpl(version));
        default:
            return nullptr;
    }
}

extern "C" const OH_AnyAPI* GENERATED_GetArkAnyAPI(int kind, int version) {
    if (kind < 0 || kind > 15) return nullptr;
    if (!impls[kind]) {
        impls[kind] = GetAnyAPIImpl(kind, version);
    }
    return impls[kind];
}
