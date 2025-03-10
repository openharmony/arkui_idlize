#include <ani.h>

#include <array>
#include <cstdint>
#include <iostream>
#include <string>
#include <string_view>
#include <vector>

std::string ANIUtils_ANIStringToStdString(ani_env *env,ani_string ani_str){
    ani_size  strSize;
    env->String_GetUTF8Size(ani_str, &strSize);
   
    std::vector<char> buffer(strSize + 1); // +1 for null terminator
    char* utf8_buffer = buffer.data();

    //String_GetUTF8 Supportted by https://gitee.com/openharmony/arkcompiler_runtime_core/pulls/3416
    ani_size bytes_written = 0;
    env->String_GetUTF8(ani_str, utf8_buffer, strSize + 1, &bytes_written);
    
    utf8_buffer[bytes_written] = '\0'; 
    std::string content = std::string(utf8_buffer); 

    return content;
}


static ani_int GetNumberArg0([[maybe_unused]] ani_env *env,
                             [[maybe_unused]] ani_object obj) {
    static int counter = 0;
    return ++counter;
}

static ani_int GetNumberArg4([[maybe_unused]] ani_env *env,
                             [[maybe_unused]] ani_object obj,
                             ani_int x, ani_int y, ani_int z, ani_int w) {
    return x + y + z + w;
}


static void parseOption(ani_env *env, ani_object obj) {
    ani_ref srcNative_ref;
    if (ANI_OK != env->Object_GetFieldByName_Ref(obj, "src", &srcNative_ref)) {
        std::cerr << "Object_GetPropertyByName_Ref src Failed" << std::endl;    
        return;
    }
    std::string srcNative = ANIUtils_ANIStringToStdString(env, static_cast<ani_string>(srcNative_ref));
    // std::cout << "src: " << srcNative << std::endl;

    ani_double destNative1;
    if (ANI_OK != env->Object_GetFieldByName_Double(obj, "dest", &destNative1)) {
        std::cerr << "Object_GetPropertyByName_Double dest Failed" << std::endl;    
        return;
    }

    // ############### for array #####################
    // std::cout << "dest: " << destNative1 << std::endl;
    ani_ref arrayNative;
    if (ANI_OK != env->Object_GetFieldByName_Ref(obj, "files", &arrayNative)) {
        std::cerr << "Object_GetPropertyByName_Ref files Failed" << std::endl;    
        return;
    }

    ani_size size;
    if(ANI_OK != env->Array_GetLength(static_cast<ani_array_ref>(arrayNative), &size)){
        std::cerr << "Array_GetLength FAILED" << std::endl;
        return;
    }
    std::vector<std::string> strings;
    for(ani_size i = 0; i < size ; i++){
        ani_ref string_ref;
        auto status = env->Array_Get_Ref(static_cast<ani_array_ref>(arrayNative), i, &string_ref);
        if(status != ANI_OK){
            std::cerr << "Array_Get_Ref FAILED index: " << i << std::endl;
            return;
        }
        strings.emplace_back(ANIUtils_ANIStringToStdString(env, static_cast<ani_string>(string_ref)));
    }
    for (const auto &s : strings) {
        // std::cout << "Array String Content:" << s.c_str() << std::endl;
     }

    // ani_double length;
    // if(ANI_OK != env->Object_GetPropertyByName_Double(static_cast<ani_array>(arrayNative), "length", &length)){
    //     std::cerr << "Object_GetPropertyByName_Double length Failed" << std::endl;    
    //     return;
    // }
    // // std::cout << "length: " << (int)length << std::endl;

    // std::vector<std::string> strings;
    // for(int i = 0; i < int(length); i++){
    //     ani_ref stringEntryRef;
    //     if(ANI_OK != env->Object_CallMethodByName_Ref(static_cast<ani_array>(arrayNative), "$_get", "I:Lstd/core/Object;", &stringEntryRef, (ani_int)i)){
    //         std::cerr << "Object_GetPropertyByName_Double length Failed" << std::endl;    
    //         return;
    //     } 
    //     strings.emplace_back(ANIUtils_ANIStringToStdString(env, static_cast<ani_string>(stringEntryRef)));
    // }





    // ############### for record #####################
    // for (const auto &s : strings) {
    //     std::cout << "files:" << s.c_str() << std::endl;
    //  }

    // ani_ref recordNative;
    // if (ANI_OK != env->Object_GetPropertyByName_Ref(obj, "maps", &recordNative)) {
    //     std::cerr << "Object_GetPropertyByName_Ref maps Failed" << std::endl;    
    //     return;
    // }

    // ani_string ani_name;
    // std::string name = "cc";
    // if (ANI_OK !=env->String_NewUTF8(name.c_str(), name.length(), &ani_name)){
    //     std::cerr << "String_NewUTF8 Failed '" << "Chloe" << "'" << std::endl;
    //     return ;
    // }

    // ani_ref ani_int_obj;
    // if (ANI_OK != env->Object_CallMethodByName_Ref(static_cast<ani_object>(recordNative), "$_get", nullptr, &ani_int_obj, ani_name)){
    //     std::cerr << "Object_CallMethodByName_Ref  $_get Faild" << std::endl;
    //     return ;
    // }

    // ani_int value;
    // if (ANI_OK != env->Object_CallMethodByName_Int(static_cast<ani_object>(ani_int_obj), "unboxed", nullptr, &value)){
    //     std::cerr << "Object_GetFieldByName_Ref Faild" << std::endl;
    //     return ;
    // }
    // std::cout << "maps: " << value << std::endl;

}

static void optionArg1([[maybe_unused]] ani_env *env, [[maybe_unused]] ani_object obj, ani_string str, ani_object obj1) {
    std::string strNative = ANIUtils_ANIStringToStdString(env, str);
    // std::cout << "strNative: " << strNative << std::endl;

    parseOption(env, obj1);
}

static void optionArg2([[maybe_unused]] ani_env *env, [[maybe_unused]] ani_object obj, ani_string str, ani_object obj1, ani_object obj2) {
    std::string strNative = ANIUtils_ANIStringToStdString(env, str);
    // std::cout << "strNative: " << strNative << std::endl;

    parseOption(env, obj1);
    parseOption(env, obj2);
}

static void optionArg3([[maybe_unused]] ani_env *env, [[maybe_unused]] ani_object obj, ani_string str, ani_object obj1, ani_object obj2, ani_object obj3) {
    std::string strNative = ANIUtils_ANIStringToStdString(env, str);
    // std::cout << "strNative: " << strNative << std::endl;

    parseOption(env, obj1);
    parseOption(env, obj2);
    parseOption(env, obj3);
}

static void optionPrim([[maybe_unused]] ani_env *env, [[maybe_unused]] ani_object obj, ani_double num) {
    double res = num;
    // std::cout << "num: " << res << std::endl;

}



ANI_EXPORT ani_status ANI_Constructor(ani_vm *vm, uint32_t *result) {
    ani_env *env;
    ani_status ret;

    // get ani env
    ret = vm->GetEnv(ANI_VERSION_1, &env);
    if (ret != ANI_OK) {
        std::cerr << "Unsupported ANI_VERSION_1" << std::endl;
        return ret;
    }

    std::string clsName;
    ani_class cls;
    ret = env->FindClass("Lffi_benchmark_ani/ani_main/ANIImpl;", &cls);
    if (ret != ANI_OK) {
        std::cerr << "Cant find class!!!!" << std::endl;
        return ret;
    }

    std::array methods = {
        ani_native_function{"getNumberArg0", nullptr, reinterpret_cast<void *>(GetNumberArg0)},
        ani_native_function{"getNumberArg4", nullptr, reinterpret_cast<void *>(GetNumberArg4)},
        ani_native_function{"optionArg1", nullptr, reinterpret_cast<void *>(optionArg1)},
        ani_native_function{"optionArg2", nullptr, reinterpret_cast<void *>(optionArg2)},
        ani_native_function{"optionArg3", nullptr, reinterpret_cast<void *>(optionArg3)},
        ani_native_function{"optionPrim", nullptr, reinterpret_cast<void *>(optionPrim)},
    };

    ret = env->Class_BindNativeMethods(cls, methods.data(), methods.size());
    if (ret != ANI_OK) {
        std::cerr << "Bind Native Methods failed!!!!" << std::endl;
        return ret;
    }

    *result = ANI_VERSION_1;
    return ANI_OK;
}
